const a = 123456789;
const b = 10;

// GASING Division
let start = performance.now();
let hasil;
for (let i = 0; i < 10000000; i++) {
    hasil = parseInt(a.toString().slice(0, -1));
}
let gasing_time = (performance.now() - start) / 1000;
console.log("GASING Division 10:", gasing_time, "seconds");

// Computer Division
start = performance.now();
for (let i = 0; i < 10000000; i++) {
    hasil = Math.floor(a / b);
}
let computer_time = (performance.now() - start) / 1000;
console.log("General Division 10:", computer_time, "seconds");

console.log("\nGASING is", computer_time/gasing_time, "times faster");