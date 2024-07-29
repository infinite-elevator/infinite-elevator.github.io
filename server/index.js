const readline = require("node:readline");
const { stdin, stdout } = require("node:process");
const { Server } = require("socket.io");

/**
 * @param elevatorIndex - integer between 0 and 15, must always be unique,
 * used for networking and to disperse the elevators at their initial positions
 */
function Elevator(elevatorIndex)
{
	this.index = elevatorIndex;
	
	/**
	 * Whether the elevator is currently open and accepting entry
	 * Networked to users - do not modify it directly!
	 */
	this.isOpen = false;
	
	/**
	 * Current floor the elevator is on, possibly moving
	 * Networked to users - do not modify it directly!
	 */
	this.currFloor = elevatorIndex * 4369 /* 65535/(16-1) */;
	
	/**
	 * The floor the elevator was on last step, possibly moving
	 */
	this.prevFloor = this.currFloor;
	
	/**
	 * Number of persons inside the elevator
	 */
	this.numPersons = 0;
	
	/**
	 * Chronological list of [floor number, ordering person ID] pairs to go to
	*/
	this.floorsToGo = [];
	// Lookup is pretty important here, but even more so is not-awful splicing
	// And it should hopefully not get THAT long - thus an Array and not a Map
	// I wonder if putting this growable at the end actually helps the JIT...
}

/**
 * Opens the elevator
 */
Elevator.prototype.open = function()
{
	io.emit("open", this.index);
	this.isOpen = true;
}

/**
 * Closes the elevator
 */
Elevator.prototype.close = function()
{
	io.emit("close", this.index);
	this.isOpen = false;
}

/**
 * Adds a [floor number, ordering person ID] pair to the 
 * @param floor - the floor number, make sure it's integral between 0 and 65535
 * @param person - unique person ID, must be a string longer than 2 characters,
 * supplying a shorter string triggers special behavior
 * @return the added floor's index on the list
*/
Elevator.prototype.addFloorToGo = function(floor, person)
{
	// Remove floor to go to previously selected by the same person
	// Unless it's one of these hacky up, dn floors...
	if(person.length > 2)
	{
		for(let i = 0; i < this.floorsToGo.length; i++)
		{
			if(this.floorsToGo[i][1] == person)
			{
				this.floorsToGo.splice(i, 1);
				break;
			}
		}
	}
	// If no floors to go to, just add this floor
	if(this.floorsToGo.length == 0)
	{
		this.floorsToGo = [[floor, person]];
		return 0;
	}
	// If it lies between the elevator and the next floor, add it first
	if((this.currFloor < floor && floor < this.floorsToGo[0][0])
	|| (this.currFloor > floor && floor > this.floorsToGo[0][0]))
	{
		this.floorsToGo.unshift([floor, person]);
		return 0;
	}
	// If it lies between any two floors on the list, add it between them
	for(let i = 1; i < this.floorsToGo.length; i++)
	{
		if((this.floorsToGo[i-1][0] < floor && floor < this.floorsToGo[i][0])
		|| (this.floorsToGo[i-1][0] > floor && floor > this.floorsToGo[i][0]))
		{
			this.floorsToGo.splice(i-1, 0, [floor, person]);
			return i-1;
		}
	}
	// See that we are now dealing with a floor that is either behind
	// all the floors on the list, or one that requires going back!
	// If it lies closer to the floor at the end of the list
	// than the one at the beginning, add it at the end
	if(Math.abs(this.floorsToGo[this.floorsToGo.length-1][0] - floor)
		< Math.abs(this.floorsToGo[0][0] - floor))
	{
		this.floorsToGo.push([floor, person]);
		return this.floorsToGo.length-1;
	}
	// Else look for two listed floors at least as far away from each other
	// as the closer of them is from this floor, add this floor between the two
	for(let i = 1; i < this.floorsToGo.length; i++)
	{
		if(Math.abs(this.floorsToGo[i-1][0] - this.floorsToGo[i][0])
			>= Math.abs(this.floorsToGo[i-1][0] - floor))
		{
			this.floorsToGo.splice(i-1, 0, [floor, person]);
			return i-1;
		}
	}
	// That floor is actually the farthest! Add it to the end of the list
	this.floorsToGo.push([floor, person]);
	return this.floorsToGo.length-1;
};

/**
 * @param floor - the floor number, make sure it's integral between 0 and 65535
 * @param person - a unique person ID, make sure it's a string
 * @return true if successfully removed, false otherwise
 */
Elevator.prototype.removeFloorToGo = function(floor, person)
{
	let i = this.floorsToGo.indexOf([floor, person]);
	if(i != -1)
	{
		this.floorsToGo.splice(i, 1);
		return true;
	}
	else return false;
};

/**
 * Check how much longer you have to wait.
 * @param floorToGoIndex - the floor's index on the list, make sure no overflow
 * @return current number of steps for elevator to reach the floor pointed to
 */
Elevator.prototype.stepsTillFloorToGo = function(floorToGoIndex)
{
	let steps = Math.ceil(Math.abs(this.currFloor
								   - this.floorsToGo[0][0]) / 64);
	for(let i = 1; i < floorToGoIndex; i++)
	{
		steps += Math.ceil(Math.abs(this.floorsToGo[i-1][0]
									- this.floorsToGo[i][0]) / 64);
	}
	return steps;
}

/**
 * A function that sends the new floor across the network, optionally sets it
 * @param floor - optional floor number, if provided, immediately teleports
 * the elevator, also setting prevFloor, must be integral between 0 and 65535
 */
Elevator.prototype.syncFloor = function(floor)
{
	if(typeof floor !== "undefined")
	{
		this.prevFloor = floor;
		this.currFloor = floor;
		io.emit("setFloorNow", [this.index, floor]);
	}
	else io.emit("setFloorAnim", [this.index, this.currFloor]);
}

/**
 * Internal function to ask for a move towards a floor
 * Does not guarantee that the elevator will make the move - there's a cooldown
 * Must be called only once during a step!
 * @param floor - the floor number, make sure it's integral between 0 and 65535
 * @return absolute number of floors the elevator moved by
 */
Elevator.prototype.goToFloor = function(floor)
{
	let prePrevFloor = this.prevFloor;
	this.prevFloor = this.currFloor;
	// Could make this shorter but much less readable
	// I prefer longer and much more readable!
	// And thus also compiled languages...
	if(floor > this.currFloor) // want to go up
	{
		// So there's some turning cooldown
		// It doesn't apply if the door is open => there was a step of a break
		if(prePrevFloor > this.currFloor && !this.isOpen) return 0;
		
		this.currFloor += Math.min(floor - this.currFloor, 64);
	}
	else // want to go down or stay here
	{
		// Turning cooldown, again
		if(prePrevFloor < this.currFloor && !this.isOpen) return 0;
		
		this.currFloor -= Math.min(this.currFloor - floor, 64);
	}
	if(this.isOpen)
	{
		this.close();
	}
	this.syncFloor();
	return Math.abs(this.currFloor - this.prevFloor);
};

/**
 * Internal function that steps the elevator
 * @return true if moved in this step, false otherwise
 */
Elevator.prototype.step = function()
{
	let floorsMoved = 0;
	if(this.floorsToGo.length != 0)
	{
		floorsMoved = this.goToFloor(this.floorsToGo[0][0]);
		
		if(this.currFloor == this.floorsToGo[0][0])
		{
			this.floorsToGo.shift();
			this.open();
		}
	}
	
	return floorsMoved != 0;
}

function ElevatorSystem()
{
	this.idleElevators = [];
	this.minDistanceElevators = [];
	
	// Create 16 elevators
	this.elevators = new Array(16);
	for(let i = 0; i < this.elevators.length; i++)
	{
		// Also disperses them across the building, see definition of Elevator
		this.elevators[i] = new Elevator(i);
	}
}

/**
 * Calls the elevator to a floor from the outside
 * @param floor - the floor number, make sure it's integral between 0 and 65535
 * @param up - whether we will go up (1), or down (0), make sure it's boolean
 * @return the index of the elevator that will come
 */
ElevatorSystem.prototype.call = function(floor, up)
{
	// Find the elevator that will take the least steps
	let minSteps = Infinity;
	let minStepsElevator;
	for(let i = 0; i < this.elevators.length; i++)
	{
		let elevator = this.elevators[i];
		
		// Temporarily modify in place the floors to go to
		let floorsToGoCopy = elevator.floorsToGo.slice();
		
		elevator.addFloorToGo(floor, "");
		
		let edge = elevator.addFloorToGo(up ? 65535 : 0, "");
		let steps = elevator.stepsTillFloorToGo(edge);
		
		if(steps < minSteps)
		{
			minSteps = steps;
			minStepsElevator = elevator;
		}
		
		elevator.floorsToGo = floorsToGoCopy;
	}
	
	// Hack - store "up" or "dn" instead of unique person ID
	// to signal the button to disable - actual ID will never be that short
	minStepsElevator.addFloorToGo(floor, up ? "up" : "dn");
	return minStepsElevator.index;
};

/**
 * Steps the whole system
 */
ElevatorSystem.prototype.step = function()
{
	this.idleElevators = [];
	for(let i = 0; i < this.elevators.length; i++)
	{
		let elevator = this.elevators[i];
		
		let stepped = elevator.step();
		
		if(!stepped && elevator.floorsToGo.length == 0
		&& elevator.numPersons == 0)
		{
			this.idleElevators.push(elevator);
		}
	}
	
	// Find the idle elevators with minimal distances to the floors to go to
	this.minDistanceElevators = Array(this.idleElevators.length);
	// n is very small, so this.minDistanceElevators should be faster as an Array
	// even though it is used like a Set (could the JIT see and optimize that?)
	for(let f = 0; f < this.idleElevators.length; f++) // floors
	{
		let minDistance = Infinity;
		let minDistanceElevator;
		for(let e = 0; e < this.idleElevators.length; e++) // elevators
		{
			if(this.minDistanceElevators.indexOf(e) != -1) continue; //allocated yet
			let elevator = this.idleElevators[e];
			let distance = Math.abs(elevator.currFloor - f * 4369);
			if(distance < minDistance)
			{
				minDistance = distance;
				minDistanceElevator = e;
			}
		}
		this.minDistanceElevators[f] = minDistanceElevator;
	}
	// Move the idle elevators
	for(let i = 0; i < this.minDistanceElevators.length; i++)
	{
		let elevator = this.idleElevators[this.minDistanceElevators[i]];
		elevator.goToFloor(i * 4369);
	}
};

const rl = readline.createInterface({ input: stdin, output: stdout });

const io = new Server(37133, {cors: {origin: "*"}});

const system = new ElevatorSystem();

io.on("connection", function(socket)
{
	io.emit("msg", "lolwhat");
	socket.on("msg", function(msg)
	{
		console.log(msg);
	});
});

let stepMode = 0;
let stepper = setInterval(function()
{
	if(!stepMode)
	{
		system.step();
	}
}, 1000);

// Now this is horrendous, I know - but didn't take a long time to bootstrap!
function tui()
{
	console.log("\n(Almost) Infinite Elevator Server Control Panel\n");
	console.log("1. Check elevator and player status");
	console.log("2. Call elevator");
	console.log("3. Teleport elevator");
	if(!stepMode) console.log("4. Toggle stepping: <every second> / manually");
	else console.log("4. Toggle stepping: every second / <manually>");
	console.log("5. Step now");
	console.log("6. Close server");
	let answer;
	rl.question("\nChoose an option by entering a number and pressing Enter: ",
	function(answer)
	{
		if(answer == "1")
		{
			console.log("\nElevator status:");
			
			let str = "";
			for(let i = 0; i < system.elevators.length; i++)
			{
				let e = system.elevators[i];
				str += "Elevator "
							+ (i+1) + " - " + (e.isOpen ? "open" : "closed")
							+ " at floor " + e.currFloor
							+ ", going to visit: ";
				
				if(e.floorsToGo.length != 0)
				{
					for(let i = 0; i < e.floorsToGo.length; i++)
					{
						if(i != 0)
						{
							str += ", then ";
						}
						str += e.floorsToGo[i][0];
						if(e.floorsToGo[i][1].length > 2)
						{
							str += " (called by " + e.floorsToGo[i][1] + ")";
						}
						else str += " (called from outside elevator)";
					}
				}
				else
				{
					elevator = system.idleElevators.indexOf(e);
					if(elevator != -1)
					{
						f = system.minDistanceElevators.indexOf(elevator)*4369;
						if(f != e.currFloor)
						{
							str += f + " (automatic movement)";
						} else str += "none";
					}
					else
					{
						str += "none";
					}
				}
				str += "\n";
			}
			
			console.log(str);
			console.log("Online player count: " + io.engine.clientsCount);
			
			rl.question("\nPress Enter to continue... ", function() {tui();});
		}
		else if(answer == "2")
		{
			rl.question("What floor would you like an elevator on? (0-65535) ",
			function(floor)
			{
				if(Number.isInteger(parseInt(floor)))
				{
					if(floor > 0 && floor < 65535)
					{
						rl.question("Should the elevator go up? [Y/n] ",
						function(yn)
						{
							if(yn == "" || yn == "y" || yn == "Y")
							{
								let e = system.call(floor, true);
								console.log("Sent elevator " + (e+1) + "!");
							}
							else if(yn == "n" || yn == "N")
							{
								let e = system.call(floor, false);
								console.log("Sent elevator " + (e+1) + "!");
							}
							else
							{
								console.log("Incorrect answer, not sending.");
							}
							tui();
						});
					}
					else if(floor == 0 || floor == 65535)
					{
						let e = system.call(floor, floor == 0);
						console.log("Sent elevator " + (e+1) + "!");
						tui();
					}
				}
				else
				{
					console.log("You have entered a wrong floor.");
					tui();
				}
			});
		}
		else if(answer == "3")
		{
			rl.question("Which elevator would you like to teleport? (1-16) ",
			function(e)
			{
				if(Number.isInteger(parseInt(e)) && e >= 1 && e <= 16)
				{
					rl.question("What floor should it teleport to? (0-65535) ",
					function(floor)
					{
						if(Number.isInteger(parseInt(floor))
						&& floor >= 0 && floor <= 65535)
						{
							system.elevators[e-1].syncFloor(parseInt(floor));
							console.log("Whoosh, teleported!");
						}
						else
						{
							console.log("You have entered a wrong floor.");
						}
						tui();
					});
				}
				else
				{
					console.log("You have entered a wrong elevator.");
					tui();
				}
			});
		}
		else if(answer == "4")
		{
			stepMode = !stepMode;
			tui();
		}
		else if(answer == "5")
		{
			system.step();
			console.log("Stepped!");
			tui();
		}
		else if(answer == "6")
		{
			console.log("Bye!");
			rl.close();
		}
		else
		{
			console.log("You have chosen a wrong option.");
			tui();
		}
	});
};

rl.on("SIGINT", function()
{
	console.log(""); // fix the newline
	rl.close();
});

rl.on("SIGCONT", function()
{
	rl.prompt(); // fix reading after Ctrl+Z
});

rl.on("close", function()
{
	clearInterval(stepper);
	io.close();
});

tui();
