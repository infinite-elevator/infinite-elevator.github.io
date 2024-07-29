# [(Almost) Infinite Elevator](https://infinite-elevator.github.io/)

## Polish

**[(Almost) Infinite Elevator](https://infinite-elevator.github.io/)** jest aplikacją-zabawką internetową dla wielu graczy symulującą pracę 16 wind w wieżowcu wysokim na 65&nbsp;535 pięter (nie licząc parteru).

Aplikacja stanowi zarazem demonstrację jednego z możliwych algorytmów pozwalających na (w miarę) wydajne przemieszczanie się wind w budynku.

**[I jest dostępna online - po prostu kliknij tutaj!](https://infinite-elevator.github.io/)**

### Wprowadzenie

W **miastowcu I** (czyt. $i$) - pierwszym z najnowszej generacji wieżowców-miast, liczącym sobie 65&nbsp;535 pięter oraz parter (piętro 0) znajduje się rząd szesnastu Bardzo Pojemnych™ wind przywoływalnych na każdym piętrze za pomocą wspólnego dla nich panelu.

Wspólny panel posiada dwa przyciski: pierwszy wyraża chęć jazdy w górę, drugi - w dół. Z oczywistymi wyjątkami:

* Panel na parterze (piętrze 0) - posiada wyłącznie przycisk wyrażający chęć jazdy w górę,
* Panel na piętrze 65&nbsp;535 - tylko przycisk wyrażający chęć jazdy w dół.

Każda winda posiada pole do wprowadzania piętra, na które chce się udać jej użytkownik. Pole jest wykonane w technologii hologramu indywidualnego - wyświetla się z osobna dla każdej osoby, która wejdzie do windy. Osoba ta wpisuje w pole numer piętra, na które chce się udać, i zatwierdza klawiszem Enter. Na każdym przystanku ma też możliwość wyjścia z windy - wówczas winda automatycznie usuwa dokonany przez nią wybór piętra.

Windy wykorzystują wspólny dla nich, zbudowany redundantnie potężny silnik krokowy (jeden krok - 64 piętra), do którego każda posiada podłączoną własną wysoce złożoną przekładnię. Dzięki takiemu rozwiązaniu windy poruszają się z prędkością 64 pięter na sekundę, osiągalną w pomijalnie krótkim czasie. Chociaż jednak winda może przerwać ruch w każdej chwili, a więc zatrzymać się na dowolnym piętrze, to opisana budowa oznacza, że rozpocząć ruch może ona tylko raz na sekundę (krok), w momencie zsynchronizowania silnika i przekładni.

Dodatkowo wieżowiec posiada zwykłe schody ruchome (obsługiwane poprzez przewijanie), pozwalają się one poruszać z prędkością tylko dwóch pięter na sekundę, ale bez dodatkowych opóźnień.

### Wspaniały algorytm przemieszczania wind 

Bo bez wspaniałego algorytmu to bym chyba wybrał schody. Szczerze mówiąc, nawet **z algorytmem** mieszkańcy często narzekają! Ale wystarczy im przypomnieć komunikację miejską... W każdym razie:

* Dla każdej windy z osobna w pamięci znajduje się uporządkowana lista pięter, na które uda się winda, przy czym pierwsza pozycja na liście jest tą, na którą winda obecnie zmierza. Gdy piętro zostało wybrane przez osobę w windzie - za pomocą hologramu - winda pamięta tę osobę.
* Gdy osoba **w windzie** wybierze piętro, na które winda ta powinna się udać, i:
  * Osoba ta wcześniej już wybrała piętro - poprzednio wybrane piętro jest kasowane i sprawdzane są dalsze warunki,
  * Brak pięter na liście - jest ono dopisywane do listy,
  * Znajduje się ono między windą i pierwszym na liście piętrem - jest dopisywane na początek listy,
  * Znajduje się ono między dwoma piętrami na liście - jest dopisywane pomiędzy nie,
  * Znajduje się ono bliżej piętra na końcu listy niż na początku - jest dopisywane na koniec listy,
  * Znajduje się ono, choć wydłuża drogę, bliżej piętra na początku listy niż na końcu, a istnieją na liście dwa piętra bardziej odległe od siebie niż pierwsze z tych dwóch pięter oraz piętro wybrane - piętro wybrane dopisywane jest między pierwsze takie znalezione dwa piętra,
  * Jeżeli powyższe warunki nie są spełnione - piętro jest dopisywane na koniec listy.
* Gdy osoby **poza windą** zamówią ją na jakieś piętro, to winda, która uwzględniając zasady podane powyżej najszybciej dotrze z piętra, na którym się obecnie znajduje na piętro, na które została zamówiona, a z niego na ostatnie piętro (tj. 0 albo 65&nbsp;535) po stronie, która została wybrana, otrzymuje na swoją listę polecenie udania się na zamówione piętro, a po dotarciu odznacza odpowiedni przycisk na panelu.
* Jeżeli jakieś windy są bezczynne - nie mają nic na liście i są puste, to ta z nich, która jest najbliżej piętra 0 kieruje się na to piętro, z pozostałych wind ta najbliżej piętra 4369 kieruje się na nie, później 8738, itd. aż do przemieszczenia wszystkich bezczynnych wind.

### Możliwe usprawnienia

* Odnotowano, że istnieje możliwość wystąpienia sytuacji, w której osoby w grupie zamawiającej windy w obu kierunkach wsiądą do niewłaściwej z nich, gdy obie przyjadą jednocześnie. Konstruktorom wydawało się jednak, że jest to zbyt rzadko występujący problem, aby poświęcać mu uwagę. *(Do dnia dzisiejszego odnotowano 11&nbsp;738 pozwów.)*
* Liczby pięter oraz wind są zakodowane na stałe, a skoro wszystkie równania są oczywiste, to mogłyby być dynamiczne. Ale wtedy w istocie algorytm miałby pewne przypadki szczególne, a jako że przecież windy i tak są bardzo drogie, to żaden problem ręcznie poprawić kod, gdy parametry się zmienią!

* Oczywistym uproszczeniem niezmiernie usprawniającym działanie wind byłaby możliwość podania piętra, na które chce się udać użytkownik, już na etapie przywołania windy.
  Jak się jednak okazało:

  * Instalacja hologramu indywidualnego na każdym piętrze, zamiast jeżdżącego wraz z windami, byłaby zaporowo droga - w istocie, cena tego kosmicznej precyzji systemu jest tak wysoka, że tylko z tej przyczyny w wieżowcu znajduje się 16 wind, a nie 128, jak pierwotnie planowano,

  * Tradycyjny klawiszowy system wprowadzania obsługiwany przez najbliżej znajdującą się osobę, mimo wysokiej kooperacji użytkowników tego systemu, okazał się nieefektywny ze względu na wytwarzany w okolicach wind głośny hałas,

  * Z zamawiania windy za pomocą telefonu zrezygnowano ze względu na pewnych dwojga nienamierzalnych żartownisiów, którzy mimo wszystkich zabezpieczeń potrafili zdalnie zamawiać windę na wszystkie piętra. A jeżdżą pewnie schodami.

  Dlatego wszystko zostało tak, jak jest. A system łatwo aplikuje się do zwyczajnych, XXI-wiecznych wind. Gdyby nie ta identyfikacja osób w środku - ale wystarczająco dobrym przybliżeniem byłoby umożliwić po prostu odznaczanie pięter...

### Opis wykonania i instalacji

Na aplikację składają się dwa niezależne moduły:

* Strona internetowa wykonana w HTML/CSS/JavaScript - implementuje interaktywny interfejs użytkownika po stronie klienta, uruchomienie jej wymaga wyłącznie pobrania repozytorium i otwarcia pliku index.html w przeglądarce internetowej,

* Skonteneryzowany w Dockerze serwer Node.JS/Socket.IO - umożliwia synchronizację między użytkownikami aplikacji, przechowując centralnie stan wind. Może być hostowany poprzez wywołanie następujących komend na systemie z prawidłowo skonfigurowanym oprogramowaniem Git oraz Docker wraz z buildx i niezablokowanym portem 37133, w katalogu, do którego mamy dostęp:
  ```sh
  git clone --depth 1 https://github.com/infinite-elevator/infinite-elevator.github.io.git
  cd infinite-elevator.github.io/server
  docker buildx build -t infinite-elevator . || sudo docker buildx build -t infinite-elevator .
  docker run -tidp 37133:37133 --restart=on-failure --name infinite-elevator infinite-elevator || sudo docker run -tidp 37133:37133 --restart=on-failure --name infinite-elevator infinite-elevator
  ```

  Jeżeli chcemy uruchomić serwer na konkretnym adresie IP, np. gdyż nasze urządzenie ma wiele publicznych adresów IP, możemy zmienić `37133:37133` na `adres_ip:37133:37133`, w rezultacie uzyskując np. `141.147.52.46:37133:37133`.

  Powyższe komendy zostały przetestowane na systemach linuksowych, ale powinny działać też w systemie macOS, a nawet w wierszu poleceń systemu Windows.

  **Następnie należy zmodyfikować plik index.html, zamieniając `141.147.52.46` na adres IP nowo postawionego serwera.**

  W celu podłączenia się do panelu kontrolnego serwera, można wykonać komendę:
  
  ```sh
  docker attach infinite-elevator || sudo docker attach infinite-elevator
  ```

  (Może być trzeba wcisnąć Enter, aby odświeżyć panel; aby się rozłączyć, wciśnij Ctrl+P+Q.)
  
  W celu odczytania logów serwera, można wykonać komendę:

  ```sh
  docker logs infinite-elevator || sudo docker logs infinite-elevator
  ```
  
  W celu zatrzymania serwera, można wykonać komendę:

  ```sh
  docker stop infinite-elevator || sudo docker stop infinite-elevator
  ```
  
  Aby wystartować go znowu, można wykonać komendę:
  
  ```sh
  docker start infinite-elevator || sudo docker start infinite-elevator
  ```
  
  W celu skasowania serwera, można wykonać komendę:
  
  ```sh
  docker rm infinite-elevator || sudo docker rm infinite-elevator
  ```

### Licencja

MIT. Poza zawartościami katalogu `ext` - są one rządzone swoimi własnymi licencjami.

### Dotacje

Ale to naprawdę aż tak dobre?

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=sendmoney%40go2%2epl&lc=US&item_name=Donate%20to%20the%20GitHub%20user%20newbthenewbd&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

Dzięki! :)

## English

**[(Almost) Infinite Elevator](https://infinite-elevator.github.io/)** is a multiplayer toy web application that simulates the operation of 16 elevators in a skyscraper 65,535 floors high (plus the ground floor).

The application simultaneously serves as a demonstration of one of the possible algorithms that allow for the (somewhat) efficient movement of elevators in a building.

**[And it's available online - simply click here!](https://infinite-elevator.github.io/)**

### Introduction

In **the cityscraper I** (pronounced $e$) - the first in the latest generation of skyscraper cities, featuring 65,535 floors plus a ground floor (floor 0), there is a row of sixteen Very Capacious™ elevators that may be called onto each floor using a shared panel.

The shared panel has two buttons: the first one expresses the desire to go up, the second - down. With obvious exceptions:

* The panel on the ground floor (floor 0) - has only a button to express the desire to go up,
* The panel on the floor 65,535 - only a button to express the desire to go down.

Each elevator has a number input field for entering the floor to which its user wants to go. The field is made with the use of the individual hologram technology - it is displayed individually for each person who enters the elevator. The person enters into the field the number of the floor to which they want to go, and confirms with the Enter key. At each stop, they also have an option of leaving the elevator - then the elevator automatically cancels their floor selection.

The elevators use a common, redundantly built mighty stepper motor (one step - 64 floors), to which each elevator has a highly complex gearshift of its own connected. Thanks to this solution, the elevators move at a speed of 64 floors per second, achievable in a negligible time. However, although an elevator may stop moving at any time, i.e. stop at any floor, the described construction means that it can start moving only once per second (step), when the engine and the gearshift are synchronized.

Additionally, the skyscraper has regular escalators (operable by scrolling), which allow for movement at a speed of only two floors per second, but without additional delays.

### The great elevator movement algorithm

Because without a great algorithm I would probably have chosen the stairs. Honestly, even **with the algorithm** residents often complain! But all we have to do is remind them how public transport was... Anyway:

* Individually for each elevator, the memory contains an ordered list/array of floors to which it will go, with the first position on the list being the one the elevator is currently heading to. Floors on the list that were selected by people in the elevator - using the hologram - are also linked to the people.
* When a person **in the elevator** selects the floor to which the elevator should go, and:
  * This person has already selected a floor - the previously selected floor is deleted and the other conditions are checked,

  * There are no floors on the list - the floor is added to the list,

  * The floor is between the elevator and the first floor on the list - it is added to the beginning of the list,

  * The floor is between two floors on the list - it is added between them,

  * The floor is closer to the floor at the end of the list than the one at the beginning - it is added to the end of the list,

  * The floor is located, although this extends the route, closer to the floor at the beginning of the list than at the end, and there exist two floors on the list that are further apart than the first of these two floors and the selected floor - the selected floor is added between the first two such floors found,

  * If the above conditions are not met - the floor is added to the end of the list.
* When people **outside the elevator** call it onto a floor, then the elevator that, taking into account the rules above, will take the least time from the floor it is currently at to the floor it was called to, and from there to the last floor (i.e. 0 or 65,535) towards the side that was selected, receives a command on its list to go to the ordered floor, and after reaching it, unchecks the appropriate button on the panel.
* If any elevators are idle, i.e. they have nothing on the list, and empty, then the one that is closest to floor 0 goes to that floor, then of the remaining elevators, the one closest to floor 4369 goes to it, then 8738, etc. until all idle elevators are moved.

### Possible improvements

* It has been noted that there is a chance of a situation happening wherein people, forming a group that calls elevators in both directions, will board the wrong one when both elevators arrive at the same time. However, the designers thought that this was too rare a problem to pay attention to. *(To date, 11,738 lawsuits have been recorded.)*

* The numbers of floors and elevators are hardcoded, while, given that all the equations are obvious, they could perhaps be made dynamic. But then there would actually be some edge cases in the algorithm, and as elevators are very expensive anyways, it's no problem to manually correct the code when the parameters change!

* An obvious simplification that would greatly improve the operation of the elevators would be the possibility to specify the floor that the user wants to reach, already at the time of calling the elevator.
  However, as it turns out:
  * Installing an individual hologram on each floor, instead of one that travels with the elevators, would be prohibitively expensive - in fact, the price of this system of space-grade precision is so high that for this reason alone there are 16 elevators in the skyscraper, not 128, as originally planned,

  * A traditional keypad entry system operated by the nearest person, despite high levels of collaboration by the users, turned out to be ineffective due to the loud noise generated in the vicinity of the elevators,

  * Ordering an elevator by phone was abandoned due to a couple of untraceable pranksters who, despite all the security measures, were able to remotely order an elevator to all the floors. And they probably take the stairs.


That's why everything stays the way it is. And the system is easily applied to ordinary, 21st-century elevators. If it weren't for the identification of people inside - but a close enough approximation is simply to allow floors to be unchecked...

### How it's made and how to install it

The application consists of two independent modules:

* A website made in HTML/CSS/JavaScript - implements an interactive user interface on the client side, to start it you only have to download the repository and open the file index.html in a web browser,

* A Node.JS/Socket.IO server containerized in Docker - enables synchronization between the users of the application, storing the status of elevators centrally. You may host it by calling the following commands on a system with correctly configured Git and Docker with buildx, and an unlocked port 37133, in a directory that you have write access to:

  ```sh
  git clone --depth 1 https://github.com/infinite-elevator/infinite-elevator.github.io.git
  cd infinite-elevator.github.io/server
  docker buildx build -t infinite-elevator . || sudo docker buildx build -t infinite-elevator .
  docker run -tidp 37133:37133 --restart=on-failure --name infinite-elevator infinite-elevator || sudo docker run -tidp 37133:37133 --restart=on-failure --name infinite-elevator infinite-elevator
  ```

  If you want to run the server on a specific IP address, e.g. because your device has multiple public IP addresses, you may change `37133:37133` to `adres_ip:37133:37133`, resulting in e.g. `141.147.52.46:37133:37133`.

  The above commands were tested on Linux systems, but should work on macOS too, and even on the Windows command line.

  **Then, you need to modify the index.html file, replacing `141.147.52.46` with the IP address of the newly setup server.**

  To attach to the server control panel, you may run the command:
  
  ```sh
  docker attach infinite-elevator || sudo docker attach infinite-elevator
  ```

  (You may have to press Enter to refresh the panel; to detach, press Ctrl+P+Q.)

  To read the server logs, you may run the command:
  
  ```sh
  docker logs infinite-elevator || sudo docker logs infinite-elevator
  ```

  To stop the server, you may run the command:
  
  ```sh
  docker stop infinite-elevator || sudo docker stop infinite-elevator
  ```

  To start it back again, you may run the command:
  
  ```sh
  docker start infinite-elevator || sudo docker start infinite-elevator
  ```
  
  To remove the server container, you may run the command:
  
  ```sh
  docker rm infinite-elevator || sudo docker rm infinite-elevator
  ```

### License

MIT. Except the contents of the `ext` directory - they are governed by their respective licenses.

### Donations

But is it really that good?

[![Donate with PayPal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=sendmoney%40go2%2epl&lc=US&item_name=Donate%20to%20the%20GitHub%20user%20newbthenewbd&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

Thanks! :)