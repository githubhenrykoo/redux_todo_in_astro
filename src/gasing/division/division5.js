const a = 123456789;
const b = 5;

// GASING Division
let start = performance.now();
let hasil;
for (let i = 0; i < 10000000; i++) {
    hasil = Math.floor((a * 2) / 10);
}
let gasing_time = (performance.now() - start) / 1000;
console.log("GASING Division 5:", gasing_time, "seconds");

// Computer Division
start = performance.now();
for (let i = 0; i < 10000000; i++) {
    hasil = Math.floor(a / b);
}
let computer_time = (performance.now() - start) / 1000;
console.log("General Division 5:", computer_time, "seconds");

console.log("\nGASING is", computer_time/gasing_time, "times faster");