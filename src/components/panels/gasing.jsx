import React, { useState } from 'react';

const Gasing = () => {
    const [numberA, setNumberA] = useState('');
    const [numberB, setNumberB] = useState('');
    const [result, setResult] = useState(null);

    const processDigitAddition = (A, B) => {
        const result = [];
        let n = 0;

        while (n < A.length && n < B.length) {
            const sum = A[n] + B[n];

            if (sum < 9) {
                // No carry now or later
                result.push(sum);
                n += 1;
            } else if (sum > 9) {
                // Carry happens now
                result.push(sum);
                n += 1;
            } else {
                // sum == 9 → ambiguous, need lookahead
                let j = 1;
                let carry = false;

                while (n + j < A.length && n + j < B.length) {
                    const nextSum = A[n + j] + B[n + j];

                    if (nextSum > 9) {
                        carry = true;
                        break;
                    } else if (nextSum < 9) {
                        carry = false;
                        break;
                    } else {
                        j += 1;
                    }
                }

                if (carry) {
                    // Retroactive carry on current 9
                    for (let k = 0; k < j; k++) {
                        result.push(10); // 9 + carry = 10
                    }
                    n += j;
                } else {
                    // No carry in the future, current stays 9
                    result.push(9);
                    n += 1;
                }
            }
        }

        return result;
    };

    const handleCalculate = () => {
        if (numberA.length !== numberB.length) {
            alert('Numbers must have the same length');
            return;
        }

        const A = numberA.split('').map(Number);
        const B = numberB.split('').map(Number);
        const additionResult = processDigitAddition(A, B);
        const totalSum = Number(numberA) + Number(numberB);
        
        setResult({
            sums: additionResult,
            carries: additionResult.map(sum => sum >= 10 ? 1 : 0),
            total: totalSum
        });
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Digit Addition Calculator</h2>
            <div className="space-y-4">
                <div>
                    <label className="block mb-2">First Number:</label>
                    <input
                        type="text"
                        value={numberA}
                        onChange={(e) => setNumberA(e.target.value)}
                        className="border p-2 rounded"
                        pattern="[0-9]*"
                    />
                </div>
                <div>
                    <label className="block mb-2">Second Number:</label>
                    <input
                        type="text"
                        value={numberB}
                        onChange={(e) => setNumberB(e.target.value)}
                        className="border p-2 rounded"
                        pattern="[0-9]*"
                    />
                </div>
                <button
                    onClick={handleCalculate}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Calculate
                </button>

                {result && (
                    <div className="mt-4">
                        <h3 className="font-bold">Results:</h3>
                        <div>First Number: {numberA}</div>
                        <div>Second Number: {numberB}</div>
                        <div className="mt-2 text-lg font-bold">Total: {result.total}</div>
                        <div className="mt-2">Sums per digit: {result.sums.join(' ')}</div>
                        <div>Carries: {result.carries.join(' ')}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gasing;