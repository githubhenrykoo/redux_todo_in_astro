use std::time::Instant;

fn main() {
    let a: i64 = 123456789;
    let b: i64 = 2;

    // GASING Division
    let start = Instant::now();
    let mut hasil: i64 = 0;
    for _ in 0..10000000 {
        hasil = a * 5 / 10;
    }
    let gasing_time = start.elapsed().as_secs_f64();
    println!("GASING Division 2: {} seconds", gasing_time);
<<<<<<< HEAD
=======
    println!("GASING Result: {}", hasil);
>>>>>>> f04baed (add and edit)

    // Computer Division
    let start = Instant::now();
    for _ in 0..10000000 {
        hasil = a / b;
    }
    let computer_time = start.elapsed().as_secs_f64();
    println!("General Division 2: {} seconds", computer_time);
<<<<<<< HEAD
=======
    println!("Computer Result: {}", hasil);
>>>>>>> f04baed (add and edit)

    println!("\nGASING is {} times faster", computer_time/gasing_time);
}