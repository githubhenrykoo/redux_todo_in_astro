import React, { useState } from 'react';

const CalculatorPanel = () => {
  const [display, setDisplay] = useState('0');
  const [history, setHistory] = useState('');
  const [firstOperand, setFirstOperand] = useState(null);
  const [operator, setOperator] = useState(null);
  const [waitingForSecondOperand, setWaitingForSecondOperand] = useState(false);

  const inputDigit = (digit) => {
    if (waitingForSecondOperand) {
      setDisplay(String(digit));
      setWaitingForSecondOperand(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForSecondOperand) {
      setDisplay('0.');
      setWaitingForSecondOperand(false);
      return;
    }

    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const clearDisplay = () => {
    setDisplay('0');
    setHistory('');
    setFirstOperand(null);
    setOperator(null);
    setWaitingForSecondOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const toggleSign = () => {
    setDisplay(parseFloat(display) * -1 + '');
  };

  const performOperation = (nextOperator) => {
    const inputValue = parseFloat(display);

    if (firstOperand === null) {
      setFirstOperand(inputValue);
      setHistory(`${display} ${nextOperator} `);
    } else if (operator) {
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setFirstOperand(result);
      setHistory(`${result} ${nextOperator} `);
    }

    setWaitingForSecondOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (firstOperand, secondOperand, operator) => {
    switch (operator) {
      case '+':
        return Math.round((firstOperand + secondOperand) * 1000000) / 1000000;
      case '-':
        return Math.round((firstOperand - secondOperand) * 1000000) / 1000000;
      case '×':
        return Math.round((firstOperand * secondOperand) * 1000000) / 1000000;
      case '÷':
        if (secondOperand === 0) {
          return 'Error';
        }
        return Math.round((firstOperand / secondOperand) * 1000000) / 1000000;
      case '%':
        return Math.round((firstOperand % secondOperand) * 1000000) / 1000000;
      default:
        return secondOperand;
    }
  };

  const calculateResult = () => {
    const inputValue = parseFloat(display);

    if (firstOperand !== null && operator) {
      const calculation = `${history}${display}`;
      const result = calculate(firstOperand, inputValue, operator);
      setDisplay(String(result));
      setHistory(`${calculation} = ${result}`);
      setFirstOperand(null);
      setOperator(null);
      setWaitingForSecondOperand(true);
    }
  };

  const percentage = () => {
    const inputValue = parseFloat(display);
    const result = inputValue / 100;
    setDisplay(String(result));
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.substring(0, display.length - 1));
    } else {
      setDisplay('0');
    }
  };

  // Button component for consistent styling
  const CalcButton = ({ onClick, className, children }) => (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg text-lg font-medium transition-all duration-150 ${className}`}
    >
      {children}
    </button>
  );

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white p-4 rounded-lg shadow-2xl">
      <div className="history text-gray-400 text-right text-sm h-6 mb-1 overflow-hidden">
        {history}
      </div>
      <div className="display mb-4 bg-gray-800 p-3 text-right text-3xl font-bold rounded-lg overflow-x-auto">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2 flex-1">
        <CalcButton 
          onClick={clearEntry} 
          className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
        >
          CE
        </CalcButton>
        <CalcButton 
          onClick={clearDisplay} 
          className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
        >
          C
        </CalcButton>
        <CalcButton 
          onClick={backspace} 
          className="bg-gray-700 hover:bg-gray-600 active:bg-gray-500"
        >
          ⌫
        </CalcButton>
        <CalcButton 
          onClick={() => performOperation('÷')} 
          className="bg-amber-600 hover:bg-amber-500 active:bg-amber-400"
        >
          ÷
        </CalcButton>

        <CalcButton 
          onClick={() => inputDigit(7)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          7
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(8)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          8
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(9)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          9
        </CalcButton>
        <CalcButton 
          onClick={() => performOperation('×')} 
          className="bg-amber-600 hover:bg-amber-500 active:bg-amber-400"
        >
          ×
        </CalcButton>

        <CalcButton 
          onClick={() => inputDigit(4)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          4
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(5)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          5
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(6)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          6
        </CalcButton>
        <CalcButton 
          onClick={() => performOperation('-')} 
          className="bg-amber-600 hover:bg-amber-500 active:bg-amber-400"
        >
          -
        </CalcButton>

        <CalcButton 
          onClick={() => inputDigit(1)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          1
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(2)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          2
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(3)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          3
        </CalcButton>
        <CalcButton 
          onClick={() => performOperation('+')} 
          className="bg-amber-600 hover:bg-amber-500 active:bg-amber-400"
        >
          +
        </CalcButton>

        <CalcButton 
          onClick={toggleSign} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          ±
        </CalcButton>
        <CalcButton 
          onClick={() => inputDigit(0)} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          0
        </CalcButton>
        <CalcButton 
          onClick={inputDecimal} 
          className="bg-gray-800 hover:bg-gray-700 active:bg-gray-600"
        >
          .
        </CalcButton>
        <CalcButton 
          onClick={calculateResult} 
          className="bg-green-600 hover:bg-green-500 active:bg-green-400"
        >
          =
        </CalcButton>
      </div>
    </div>
  );
};

export default CalculatorPanel;
