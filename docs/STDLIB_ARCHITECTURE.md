# Jawalang Standard Library Architecture

Dokumen iki njlentrehake arsitektur internal fungsi bawaan (*built-in functions*) lan pondhasi *standard library* Jawalang V1.4.0.

---

## 1. Current Builtin Registration

Ing runtime Jawalang (`src/interpreter.js`), kabeh fungsi bawaan didaftarake ing njero kamus `builtins` sajrone inisialisasi fungsi `interpret(ast, globalEnv, functions, filePath, isModule, structs)`:

```javascript
const builtins = {
    jinis(args) { ... },
    dawa(args) { ... },
    jupuk(args) { ... },
    nambah(args) { ... },
    busak(args) { ... },
    // ...
    ...stdlibBuiltins
};
```

Saben properti ing `builtins` minangka fungsi JavaScript murni sing nampa array siji yaiku `args` (dhaptar argumen sing wis dievaluasi kanthi leksikal).

---

## 2. Builtin Runtime Representation

Jawalang ndhukung fungsi minangka **first-class citizen**. Ana rong cara simbol built-in direpresentasikan ing runtime:

1. **Pemanggilan Langsung (`CallExpression`)**:
   Nalika callee minangka `IDENTIFIER` lan jenenge ana ing `builtins`, interpreter langsung ngeksekusi handler:
   ```javascript
   if (calleeName in builtins) {
       return builtins[calleeName](evaluatedArgs);
   }
   ```

2. **First-Class Function Value**:
   Nalika jeneng built-in diakses minangka ekspresi tanpa tandha kurung (kayata `gawe f = abs`), interpreter ngasilake obyek fungsi bawaan:
   ```javascript
   if (node.value in builtins) {
       return {
           _isFunction: true,
           _isBuiltin: true,
           name: node.value
       };
   }
   ```
   Nalika obyek iki diceluk ing papan liya liwat `invokeCallable(candidate, evaluatedArgs, displayName)`, interpreter ndeteksi `candidate._isBuiltin` banjur nerusake menyang `builtins[candidate.name](evaluatedArgs)`. Iki njamin kompatibilitas 100% karo:
   - Variabel sing nyimpen fungsi (`gawe f = abs; f(-10)`)
   - Elemen array (`gawe ops = [abs, trim]; ops[0](-5)`)
   - Properti obyek (`gawe tools = { "hitung": abs }; tools["hitung"](-8)`)
   - Higher-Order Functions (`terapkan(abs, [-1, -2, -3])`)

---

## 3. Argument Validation

Validasi gunggung argumen ditindakake sacara ketat sadurunge logika fungsi diproses:

- **Pola Pesan Kesalahan**:
  ```text
  Function built-in "<nama>" mbutuhake <N> argument, nanging diwenehi <M> (Function built-in "<nama>" membutuhkan <N> argument)
  ```
- **Fungsi Multi-Arity**:
  Kanggo fungsi kanthi argumen opsional (kayata `takon(prompt?)`):
  ```text
  Function built-in "takon" mbutuhake 0 utawa 1 argument, nanging diwenehi <M> (Function built-in "takon" membutuhkan 0 atau 1 argument)
  ```

---

## 4. Type Validation

Jawalang ngetrapake sistem tipe data dinamis sing ketat (*strict typing without implicit coercion*). Pangecekan tipe nggunakake helper `getType(val)` terpusat:

```javascript
function getType(val) {
    if (val === null) return "null";
    if (Array.isArray(val)) return "array";
    if (typeof val === "boolean") return "boolean";
    if (typeof val === "number") return "number";
    if (typeof val === "string") return "string";
    if (val && typeof val === "object" && val._isNamespace) return "namespace";
    if (val && typeof val === "object" && val._isInstance) return "instance";
    if (val && typeof val === "object" && val._isStruct) return "struct";
    if (typeof val === "function" || (val && typeof val === "object" && val._isFunction)) return "function";
    if (typeof val === "object") return "object";
    return "unknown";
}
```

- **Pola Pesan Kesalahan Argumen Tunggal**:
  ```text
  <nama>() mung bisa digunakake kanggo <tipe>, nanging ditemu: "<tipe_aktual>" (<nama>() hanya bisa digunakan untuk <tipe>)
  ```
- **Pola Pesan Kesalahan Multi-Argumen**:
  ```text
  Argument kapisan <nama>() kudu <tipe>, nanging ditemu: "<tipe_aktual>" (Argument pertama <nama>() harus <tipe>)
  Argument kapindho <nama>() kudu <tipe>, nanging ditemu: "<tipe_aktual>" (Argument kedua <nama>() harus <tipe>)
  Argument katelu <nama>() kudu <tipe>, nanging ditemu: "<tipe_aktual>" (Argument ketiga <nama>() harus <tipe>)
  ```

---

## 5. Error Handling

Kabeh kesalahan validasi utawa operasi ilegal mbuwang obyek `Error` standar JavaScript sing kanthi otomatis ditangkep dening runtime exception handling Jawalang (`coba ... tangkep err { ... }`):

- **Zero Unhandled Native Crashes**: Ora ana *crash* proses utawa *unhandled exception*.
- **Zero Silent NaN**: Operasi matematika sing ora sah (kayata `akar(-1)`) mbuwang kesalahan eksplisit lan ora tau ngasilake `NaN` sacara meneng-menengan.
- **Konsistensi Format**: Kabeh pesen kesalahan nggunakake basa Jawa mawa katerangan basa Indonesia ing njero tanda kurung.

---

## 6. Return Values

Kabeh nilai bali saka fungsi bawaan kudu cocog karo tipe data resmi Jawalang:
- Primitif: `number`, `string`, `boolean` (`true` / `false` sing dicithak minangka `bener` / `salah`), utawa `null`.
- Koleksi: JavaScript Array standar `[]` (kanggo tipe `array` Jawalang) utawa JavaScript Plain Object `{}` (kanggo tipe `object` Jawalang).
- Ora ana obyek eksternal utawa fungsi mentah JavaScript sing bocor tanpa bungkus (*unwrapped*).

---

## 7. Extension Strategy (Phase 10 Foundation)

Kanggo nyegah file `src/interpreter.js` dadi monolitik lan angel dikembangake, standard library diatur menyang modul kapisah ing direktori `src/stdlib/`:

```text
src/
├── stdlib/
│   ├── index.js     (Aggregator & metadata export)
│   ├── helpers.js   (Type & argument validators)
│   ├── math.js      (abs, min, max, akar, pangkat)
│   └── string.js    (ngemot, diwiwiti, dipungkasi, trim, pecah)
└── interpreter.js   (Wiring stdlibBuiltins menyang builtins)
```

Fungsi bawaan inti lawas (`jinis`, `dawa`, `jupuk`, `nambah`, `busak`, `motong`, `ngganti`, `gedhe`, `cilik`, `takon`, `kunci`, `nilai`, `duwe`, `terapkan`, `saring`, `itung`, `gabung`, `balik`, `urut`, `ana`, `kabeh`, `golek`, `indeks`) tetep dilestarekake 100% tanpa owah-owahan perilaku.

---

## 8. Compatibility Rules

1. **Pure Function Principle**: Kabeh utility Math lan String anyar asipat deterministik, bebas efek samping (*side-effect free*), lan ora tau ngowahi (*mutate*) argumen sing diwenehake.
2. **First-Class Functions**: Kabeh utility anyar bisa disimpen ing variabel, array, obyek, utawa dikirim minangka callback.
3. **Higher-Order Functions**: Kabeh utility anyar kompatibel karo `terapkan`, `saring`, `ana`, `kabeh`, `golek`, lan `itung`.
4. **LSP Synchronization**: Metadata fungsi bawaan anyar disinkronake menyang Language Server Protocol (`language-server/src/utils.js`) saengga otomatis nyengkuyung autokomplit, hover doc, signature help, semantic tokens (`defaultLibrary`), lan deteksi tipo.
5. **No System Leaks**: Ora ana API filesystem, jaringan, proses OS, utawa `eval` ing rilis foundation iki.
