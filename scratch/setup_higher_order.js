const fs = require("fs");
const path = require("path");

// 1. examples/modules/functional_mod.jawa
const functionalModContent = `// functional_mod.jawa — Module fixture kanggo test higher-order function
gawe faktor = 10

ekspor fungsi kaliFaktor(x) {
    bali x * faktor
}

ekspor fungsi kuadrat(x) {
    bali x * x
}

ekspor fungsi transformasiData(fn, arr) {
    bali terapkan(fn, arr)
}
`;

fs.writeFileSync("D:\\Jawascript\\examples\\modules\\functional_mod.jawa", functionalModContent, "utf8");
console.log("Created D:\\Jawascript\\examples\\modules\\functional_mod.jawa");
