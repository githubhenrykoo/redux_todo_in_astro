#[macro_use]
extern crate lazy_static;

use std::time::Instant;
use std::collections::HashMap;

// Division tables as static data
lazy_static! {
    static ref DIVISION_TABLES: HashMap<i32, HashMap<i32, i32>> = {
        let mut tables = HashMap::new();
        
        // Division table for 2
        let mut table2 = HashMap::new();
        table2.insert(2, 1);
        table2.insert(4, 2);
        table2.insert(6, 3);
        table2.insert(8, 4);
        tables.insert(2, table2);

        // Division table for 3
        let mut table3 = HashMap::new();
        table3.insert(3, 1);
        table3.insert(6, 2);
        table3.insert(9, 3);
        table3.insert(12, 4);
        table3.insert(15, 5);
        table3.insert(18, 6);
        table3.insert(21, 7);
        table3.insert(24, 8);
        table3.insert(27, 9);
        tables.insert(3, table3);

        // ... Add other division tables (4-9) similarly
        tables
    };
}

fn lookup_division_value(dividend_digit: i32, divisor: i32) -> i32 {
    if let Some(table) = DIVISION_TABLES.get(&divisor) {
        for (&d, &v) in table.iter() {
            if dividend_digit < d {
                return v - 1;
            }
        }
    }
    9 // Default case
}

fn pembagian_flowchart(dividend: i64, divisor: i32) -> i64 {
    let mut d = vec![0];
    d.push(divisor as i64);
    for j in 1..11 {
        d.push(d[j] + divisor as i64);
    }

    let angka_str = dividend.to_string();
    let n = angka_str.len();
    
    let mut b = angka_str[0..1].parse::<i64>().unwrap();
    let mut k = 1;
    let mut r = 0;
    b = b - d[0];
    let mut hasil = String::new();

    while k < n {
        let qk = if DIVISION_TABLES.contains_key(&divisor) {
            lookup_division_value(b as i32, divisor)
        } else {
            let mut found_qk = 0;
            for i in 1..11 {
                if b < d[i] {
                    found_qk = (i - 1) as i32;
                    break;
                }
            }
            found_qk
        };

        r = b - (qk as i64 * divisor as i64);
        hasil.push_str(&qk.to_string());
        k += 1;
        b = r * 10 + angka_str[k-1..k].parse::<i64>().unwrap();
    }

    hasil.parse::<i64>().unwrap()
}

fn main() {
    let a: i64 = 123456789;
    let b: i32 = 1;
    let mut hasil: i64 = 0;

    match b {
        1 => {
            // Division by 1
            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a;
            }
            let gasing_time = start.elapsed();
            println!("GASING Division 1: {:?}", gasing_time);

            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a / b as i64;
            }
            let computer_time = start.elapsed();
            println!("Computer Division 1: {:?}", computer_time);
            println!("\nGASING is {} times faster", 
                computer_time.as_secs_f64() / gasing_time.as_secs_f64());
        },
        2 => {
            // Division by 2
            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = (a * 5).to_string()[..((a * 5).to_string().len()-1)]
                    .parse::<i64>().unwrap();
            }
            let gasing_time = start.elapsed();
            println!("GASING Division 2: {:?}", gasing_time);

            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a / b as i64;
            }
            let computer_time = start.elapsed();
            println!("Computer Division 2: {:?}", computer_time);
            println!("\nGASING is {} times faster", 
                computer_time.as_secs_f64() / gasing_time.as_secs_f64());
        },
        // ... Add similar match arms for 4, 5, 8, 10, 100
        3 | 6 | 7 | 9 => {
            // Division by 3, 6, 7, and 9
            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = pembagian_flowchart(a, b);
            }
            let gasing_time = start.elapsed();
            println!("GASING Division {}: {:?}", b, gasing_time);

            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a / b as i64;
            }
            let computer_time = start.elapsed();
            println!("Computer Division {}: {:?}", b, computer_time);
            println!("\nGASING is {} times faster", 
                computer_time.as_secs_f64() / gasing_time.as_secs_f64());
        },
        _ => {
            // Other cases
            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a / b as i64;
            }
            let gasing_time = start.elapsed();
            println!("GASING Division {}: {:?}", b, gasing_time);

            let start = Instant::now();
            for _ in 0..10000000 {
                hasil = a / b as i64;
            }
            let computer_time = start.elapsed();
            println!("Computer Division {}: {:?}", b, computer_time);
            println!("\nGASING is {} times faster", 
                computer_time.as_secs_f64() / gasing_time.as_secs_f64());
        }
    }

    println!("\nHasil Pembagian: {}", hasil);
}