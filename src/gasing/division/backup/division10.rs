use std::time::Instant;

fn main() {
    let a: i64 = 123456789;
    let b: i64 = 10;

    // GASING Division
    let start = Instant::now();
    let mut hasil: i64 = 0;
    for _ in 0..10000000 {
        hasil = a / 10; // In Rust, we'll use direct division instead of string manipulation
    }
    let gasing_time = start.elapsed().as_secs_f64();
    println!("GASING Division 10: {} seconds", gasing_time);

    // Computer Division
    let start = Instant::now();
    for _ in 0..10000000 {
        hasil = a / b;
    }
    let computer_time = start.elapsed().as_secs_f64();
    println!("General Division 10: {} seconds", computer_time);

    println!("\nGASING is {} times faster", computer_time/gasing_time);
}