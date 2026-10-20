# Naloga 2 – Testiranje enot (frontend)

## Uporabljena orodja umetne inteligence

| Orodje | Namen |
|---|---|
| **Claude (Anthropic), model Claude Opus 5.5**, v aplikaciji Claude kot agent z dostopom do lupine in datotek | izločitev enot iz komponent, generiranje testov, zagon testov, vnos napak, pregled testov, cevovod |

Orodja, ki niso UI, a so bila uporabljena: Jest 29 + ts-jest, React Testing Library, Stryker Mutator 8 (mutacijsko testiranje).

---

## 1. Izbrane enote in utemeljitev

Logika je bila prej zapisana neposredno v React komponentah (in na več mestih podvojena), zato je ni bilo mogoče testirati ločeno. Izločil sem jo v čiste funkcije v `src/utils/` in komponente prilagodil, da jih uporabljajo.

| # | Enota | Datoteka | Zakaj je netrivialna |
|---|---|---|---|
| 1 | `toKw`, `cleanParams`, `buildSearchParams`, `buildSearchQuery` | `utils/searchQuery.ts` | Pretvorba enot (HP → kW) z zaokroževanjem, pogojno preslikavanje polj, odstranjevanje praznih vrednosti. Ista logika je bila kopirana v 4 datoteke in je imela razlike (avtomobilski obrazec ob oddaji **ni** pretvarjal HP v kW). |
| 2 | `sortVehicles`, `paginate`, `classifyVehicle` | `utils/vehicleList.ts` | Primerjalna funkcija z manjkajočimi vrednostmi, robni primeri strani (prazen seznam, stran izven obsega), razvrščanje vozil v natanko en tip. |
| 3 | `validatePhone`, `parsePreferenceField`, `cleanPreference`, `validatePreference` | `utils/validation.ts` | Validacija vhodov z mejnimi vrednostmi (6/15 števk, letnik 1900–tekoče leto, negativna števila, NaN). |
| 4 | `buildPreferenceParams`, `fetchRecommendations` | `utils/recommendations.ts` | Veriga nadomestnih poizvedb (vsi filtri → samo znamka → karkoli), odstranjevanje dvojnikov, omejitev na 12, obravnava napak omrežja. Zahteva nadomestne objekte (axios). |
| + | komponenta `Watchlist` (obstoječi test) | `pages/Watchlist.tsx` | Pregled in popravilo obstoječega testa. |

## 2. Kako bi morale enote delovati (specifikacija)

Pričakovane vrednosti v testih izhajajo iz te specifikacije, **ne** iz trenutnega obnašanja kode.

### 2.1 `searchQuery`
- `toKw(v, 'HP')` = `round(v / 1,36)` (metrična KS, kot na evropskih oglasih); `toKw(v, 'kW')` = `round(v)`. Za `NaN`/`±Infinity` vrže `RangeError`.
- `cleanParams` odstrani `''`, `null`, `undefined`; ohrani `0`.
- `buildSearchParams`: nedotaknjen obrazec → `{}` (tudi ko je `powerUnit='kW'`, saj to ni filter); `yearFrom` se pošlje tudi kot `first_registration`; `powerFrom/powerTo` se pretvorita v `engineKwFrom/engineKwTo`, polja `powerFrom`, `powerTo`, `powerUnit` se ne pošljejo; neštevilska moč se ignorira (ne pošlje se `NaN`); vhodni objekt se ne spremeni.
- `buildSearchQuery`: pravilno URL-kodiranje (presledki, `&`).

### 2.2 `vehicleList`
- `sortVehicles`: vrne nov seznam (vhoda ne spreminja); razvrsti po ceni/kilometrih naraščajoče ali padajoče; oglasi **brez vrednosti** (`null`, `undefined`, `NaN`, ne-število) so **vedno na koncu**, v obeh smereh; `0` je veljavna vrednost; enaki elementi ohranijo vrstni red; neznan način → nespremenjen vrstni red.
- `paginate(items, page, perPage)`: `totalPages = max(1, ceil(n / perPage))`; stran se omeji na `[1, totalPages]`; `NaN` → 1; neveljaven `perPage` (≤ 0, neceloštevilski) → `RangeError`.
- `classifyVehicle(item, searchType)`: vrne **natanko en** tip. Izbrani tip iskanja ima prednost; brez njega: `fuel_type` **in** `gearbox` → avto, samo `engine_kw` → motor, sicer `unknown`.

### 2.3 `validation`
- `validatePhone`: po odstranitvi presledkov, `-`, `.`, `/` je veljavno: neobvezen `+` na začetku in 6–15 števk. Vrne `''` ali slovensko sporočilo o napaki. Ne vrže izjeme za manjkajočo vrednost.
- `parsePreferenceField`: številska polja → število (`''` ostane `''`), besedilna polja ostanejo niz.
- `validatePreference`: zahteva znamko **ali** model (presledki ne štejejo); številska polja morajo biti končna in ≥ 0; letnik mora biti celo število med 1900 in tekočim letom; vrne vse napake hkrati.

### 2.4 `recommendations`
- Za vsako preferenco: poskusi vse filtre → samo znamko (le če obstaja) → katerokoli vozilo tega tipa; prvi neprazen odgovor zmaga, nadaljnjih poizvedb ni. Vsaka poizvedba zahteva 1 oglas na pravem endpointu (`/api/cars`, `/api/motorcycles`, `/api/trucks`).
- Rezultati brez dvojnikov (`_id`), dopolnjeni z najnovejšimi avtomobili, največ 12; ko je 12 doseženo, se poizvedbe ustavijo.
- Napaka pri eni preferenci jo preskoči; napaka pri dopolnjevanju vrne, kar je že zbrano; funkcija nikoli ne vrže izjeme. Nenastavljena polja se ne pošljejo.

---

## 3. Ukaz agentu UI

> Si agent za testiranje programske opreme. V React + TypeScript (Vite) frontendu projekta za primerjavo cen vozil izloči netrivialno logiko iz komponent `SearchForm`, `MotorcycleSearchForm`, `TruckSearchForm`, `Results`, `Register`, `CarPreferences` in `Home` v čiste funkcije v `src/utils/` in zanje napiši teste enot.
>
> **Ogrodje:** Jest 29 s `ts-jest`, okolje `jsdom`, React Testing Library za komponente, `@testing-library/jest-dom` za ujemalnike. Ne uporabljaj `import.meta` v testirani kodi – osnovni URL podaj kot parameter.
>
> **Pokritost:** za vsako funkcijo (1) običajne primere, (2) robne vrednosti (meje intervalov, prazni seznami, 0, prva/zadnja stran, točno deljiva dolžina), (3) neveljavne vhode (`NaN`, `null`, `undefined`, napačni tipi, nizi z nepričakovanimi znaki), (4) izjeme (`RangeError`) in napake omrežja (zavrnjene obljube).
>
> **Nadomestni objekti:** `jest.mock('axios')` z usmerjevalnikom, ki odgovarja glede na pot in parametre URL-ja; `jest.mock('firebase/auth')` s tovarno za `getAuth`; `console.error` utišaj s `jest.spyOn`. Brez resničnih omrežnih klicev.
>
> **Poimenovanje:** `describe('<ime enote>')`, testi `it('should <pričakovano obnašanje> when <pogoj>')`, parametrizirani primeri z `it.each`. Ena datoteka na enoto: `src/__tests__/<enota>.test.ts`.
>
> **Pravila kakovosti:** pričakovane vrednosti izračunaj iz specifikacije (priložena), ne iz trenutnega izhoda kode; preverjaj opazno obnašanje, ne notranjih podrobnosti; vsak test mora imeti vsaj eno smiselno trditev; brez podvojenih testov.

Specifikacija iz poglavja 2 je bila priložena ukazu.

---

## 4. Rezultati

- **125 testov**, 5 testnih datotek, vsi uspešni (~2,5 s).
- Pokritost: `src/utils/**` **100 %** stavkov, vej, funkcij in vrstic; skupaj z `Watchlist.tsx` 98,4 % stavkov / 97,9 % vej.
- Mutacijska ocena (Stryker) na `src/utils/**`: **91,7 % → 94,8 %** po popravkih testov (preostali preživeli mutanti so ekvivalentni ali spreminjajo samo besedilo dnevniških sporočil, ki ga namenoma ne preverjamo).

## 5. Namerno vnesene napake

Skripta `scripts/inject-bugs.cjs` (`npm run test:bugs`) napake vnese eno po eno, zažene teste te enote, zabeleži rezultat in datoteko obnovi. Napaka šteje kot zaznana samo, če pade vsaj ena **trditev** (sesutje ali napaka prevajanja se šteje kot `ERROR`).

| ID | Enota | Napaka | Padlih testov |
|---|---|---|---|
| search-1 | searchQuery | HP → kW množi namesto deli | 8 |
| search-2 | searchQuery | `Math.floor` namesto `Math.round` | 7 |
| search-3 | searchQuery | `powerUnit` se pošlje na strežnik | 6 |
| search-4 | searchQuery | `yearFrom` se ne preslika v `first_registration` | 1 |
| vehicle-1 | vehicleList | oglasi brez cene na začetku | 3 |
| vehicle-2 | vehicleList | `floor` namesto `ceil` pri številu strani | 4 |
| vehicle-3 | vehicleList | zamik strani za ena (off-by-one) | 3 |
| vehicle-4 | vehicleList | avto prepoznan po `fuel_type` **ali** `gearbox` | 1 |
| valid-1 | validation | zgornja meja telefona 14 namesto 15 | 1 |
| valid-2 | validation | letnik 1900 zavrnjen (`<` → `<=`) | 1 |
| valid-3 | validation | 0 zavrnjena kot negativna | 1 |
| valid-4 | validation | zahteva znamko **in** model | 13 |
| reco-1 | recommendations | nadomestne poizvedbe tečejo tudi po zadetku | 3 |
| reco-2 | recommendations | brez omejitve na 12 | 1 |
| reco-3 | recommendations | brez odstranjevanja dvojnikov | 1 |
| reco-4 | recommendations | ena neuspešna preferenca prekine vse | 2 |
| watch-1 | Watchlist | odstrani izbriše cel seznam | 1 (stari test: **0**) |
| watch-2 | Watchlist | prikaže seznam ne glede na prijavljenega uporabnika | 1 (stari test: **0**) |

**18/18 zaznanih.** Prvotni test `Watchlist.test.tsx` ni zaznal nobene od obeh napak v Watchlistu.

## 6. Pomanjkljivi testi in popravki

Pomanjkljivosti sem iskal z ročnim pregledom in z mutacijskim testiranjem (Stryker), ki pokaže, katere spremembe kode noben test ne zazna. Celoten diff prvega osnutka in popravljenih testov je v `docs/pregled-testov.diff`.

| # | Kategorija | Kje | Težava | Popravek |
|---|---|---|---|---|
| 1 | **Test, ki nič ne preverja** | `scripts/inject-bugs.cjs` (prva različica) | Skripta je poročala „16/16 zaznanih“, ker se je Jest sesul že ob napačno razčlenjenem argumentu `--reporters` – izhodna koda ≠ 0 je bila napačno razumljena kot uspeh. | Preverjanje zelenega izhodišča pred vnosom napak; „zaznano“ samo, če pade vsaj ena trditev; ločen status `ERROR`. |
| 2 | Šibka trditev | `recommendations.test.ts` | `toEqual({ make: 'Audi' })` sprejme tudi `{ make: 'Audi', model: undefined }`, kar bi `URLSearchParams` poslal kot `model=undefined`. Stryker: mutant `if (true) p.model = …` je preživel. | `toStrictEqual` + nov test, da URL ne vsebuje `undefined`. |
| 3 | Pretesna vezanost na podatke | `vehicleList.test.ts` | Test „zaupaj tipu iskanja“ je za vse tri tipe uporabil objekt v obliki avtomobila, zato je tip `car` prestal test tudi brez upoštevanja namiga (mutant preživel). | Za vsak tip objekt, katerega oblika kaže na **drug** tip. |
| 4 | Premalo primerov | `vehicleList.test.ts` | Manjkajoče cene so bile preverjene le v enem vrstnem redu vhoda; primerjalnik, ki je pravilen samo za en vrstni red argumentov, je preživel. `NaN` in nizi niso bili preverjeni. | `it.each` s 4 razporeditvami, obe smeri, `NaN`, cena kot niz. |
| 5 | Krožna trditev | `validation.test.ts` | Neveljavne številke so preverjene s `toBe(PHONE_ERROR)` – če bi bila konstanta po pomoti `''`, bi bile neveljavne številke sprejete, test pa bi še vedno uspel. | Dodano `not.toBe('')`. |
| 6 | Test konstante (preveč vezan na implementacijo / podvojen) | `searchQuery.test.ts` | `expect(HP_PER_KW).toBe(1.36)` prepisuje vrednost iz kode; pretvorbe so že preverjene z dejanskimi primeri. | Odstranjen. |
| 7 | Preveč vezan na implementacijo | `vehicleList.test.ts` | `not.toBe(list)` (identiteta seznama) – specifikacija zahteva le, da vhod ni spremenjen, kar preverja drug test. | Odstranjen. |
| 8 | Test konstante | `validation.test.ts` | `expect(PHONE_ERROR).toMatch(...)` preverja konstanto, ne obnašanja. | Združen v test, ki preveri sporočilo, ki ga vrne funkcija. |
| 9 | Nepreverjeno sporočilo izjeme | `searchQuery`, `vehicleList` | `toThrow(RangeError)` ne preveri, da sporočilo vsebuje napačno vrednost. | `toThrow(new RangeError('…'))`. |
| 10 | Manjkajoč primer | `validation.test.ts` | `validatePreference` z neočiščenim `''` ni bil preverjen (mutant preživel). | Dodan test. |
| 11 | Mrtva priprava | `Watchlist.test.tsx` (obstoječi) | `globalThis.VITE_BACKEND_API_URL = …` – komponenta tega ne uporablja (in Vite tako ne bere spremenljivk). | Odstranjeno. |
| 12 | Odvisnost od vrstnega reda in okolja | `Watchlist.test.tsx` | `localStorage` se je čistil le v enem testu; `/10,000 €/` je odvisen od lokalizacije izvajalnega okolja. | `localStorage.clear()` v `beforeEach`; regex, neodvisen od lokale. |
| 13 | Ne zazna napake | `Watchlist.test.tsx` | Test odstranjevanja ima en sam element in preveri samo `localStorage` – napaka „izbriši vse“ preživi (watch-1). UI ni preverjen. | Dva elementa, odstrani enega, preveri UI in shrambo. |
| 14 | Manjkajoči primeri | `Watchlist.test.tsx` | Ni testov za neprijavljenega uporabnika, ločitev seznamov po uporabnikih (watch-2 preživi), pokvarjene podatke, odjavo poslušalca. | Dodani testi. |

## 7. Dejanske napake v kodi, ki so jih razkrili testi po specifikaciji

1. **Podvojen prikaz podrobnosti v rezultatih**: varovali `isCar` in `isTruck` sta se prekrivali – avto s `first_registration` je dobil oba bloka podrobnosti. Zdaj `classifyVehicle` vrne natanko en tip in upošteva izbrani tip iskanja.
2. **Avtomobilsko iskanje ni pretvarjalo HP v kW** ob oddaji (štetje rezultatov je pretvarjalo, `onSearch(form)` pa ne) – številka na gumbu in dejanski rezultati sta se razlikovala.
3. **Oglasi brez cene so bili razvrščeni kot najcenejši** (`null ?? 0`).
4. **Prazni rezultati so prikazali „Stran 1 / 0“**, gumb „Naslednja“ pa ni bil onemogočen.
5. **Watchlist se je sesul** ob pokvarjenem vnosu v `localStorage` (`JSON.parse` brez `try`).
6. **Priporočila**: ena neuspešna poizvedba je prekinila vsa priporočila; pri več kot 12 preferencah je bilo rezultatov več kot 12; `Math.ceil(0/4) = 0` v vrtiljaku je dal `% 0 = NaN`.
7. **Sporočilo o napaki telefona je bilo v makedonščini** („Vnesi validen broj (6-15 cifri)“), številke s presledki („040 123 456“) pa so bile zavrnjene.

## 8. Cevovod

`.github/workflows/test.yml`:
- `unit-tests`: `npm ci` → `npm run test:ci` (`jest --ci --coverage`). Neuspešen test **ali** pokritost pod pragom (`coverageThreshold` v `jest.config.cjs`: 90 % stavki/funkcije/vrstice, 85 % veje) vrne izhodno kodo 1 in ustavi cevovod; preverjeno lokalno (izhod 1 ob padlem testu, 0 ob uspehu).
- Poročilo o pokritosti: povzetek v *Job summary*, artefakt `frontend-coverage` (HTML `lcov-report`, `lcov.info`, Cobertura XML, `junit.xml`).
- `build` ima `needs: unit-tests`, zato se ne izvede, če testi padejo.
- `test-quality` (ročni zagon): vnos napak + Stryker, artefakt `mutation-report`.

## 9. Zagon

```bash
npm test               # testi
npm run test:ci        # testi + pokritost (kot v cevovodu)
npm run test:bugs      # vnos namernih napak
npm run test:mutation  # Stryker
```
