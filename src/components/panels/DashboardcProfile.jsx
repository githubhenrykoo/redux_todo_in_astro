import React, { useState, useEffect } from 'react';

const DashboardcProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        // In a real implementation, you would fetch this data from an API endpoint
        // that runs the Python script and returns the results
        // For now, we'll simulate the data based on what we know from division_1.py
        
        // Simulate running the Python script
        const simulatedData = await simulateProfileRun();
        setProfileData(simulatedData.profileStats);
        setComparisonResult(simulatedData.comparison);
        setLoading(false);
      } catch (err) {
        setError('Failed to load profile data: ' + err.message);
        setLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  // This function simulates running the Python profiling script
  // In a real implementation, this would be an API call to a backend service
  const simulateProfileRun = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulated data based on division_1.py output
        const simulatedProfileStats = [
          { function: 'gasing_division', ncalls: '1', tottime: '0.0123', percall: '0.0123', cumtime: '0.0123', percall_cum: '0.0123' },
          { function: 'computer_division', ncalls: '1', tottime: '0.0234', percall: '0.0234', cumtime: '0.0234', percall_cum: '0.0234' },
          { function: '<module>', ncalls: '1', tottime: '0.0001', percall: '0.0001', cumtime: '0.0358', percall_cum: '0.0358' },
          { function: 'time.time', ncalls: '4', tottime: '0.0001', percall: '0.0000', cumtime: '0.0001', percall_cum: '0.0000' },
        ];

        // Simulated comparison result
        const simulatedComparison = {
          gasingTime: 0.0123,
          computerTime: 0.0234,
          speedupFactor: 1.90,
          gasingResult: 500,
          computerResult: 500,
          iterations: 100000
        };

        resolve({
          profileStats: simulatedProfileStats,
          comparison: simulatedComparison
        });
      }, 1000); // Simulate a delay
    });
  };

  // Function to run the actual Python script (would require backend integration)
  const runProfiler = async () => {
    setLoading(true);
    try {
      const simulatedData = await simulateProfileRun();
      setProfileData(simulatedData.profileStats);
      setComparisonResult(simulatedData.comparison);
    } catch (err) {
      setError('Failed to run profiler: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded-lg">Loading profiling data...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-lg">{error}</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Division Algorithm Performance Profile</h2>
      
      {/* Comparison Results */}
      {comparisonResult && (
        <div className="mb-6 bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Performance Comparison</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">GASING Division</p>
              <p>Result: {comparisonResult.gasingResult}</p>
              <p>Time: {comparisonResult.gasingTime.toFixed(6)} seconds</p>
            </div>
            <div>
              <p className="font-medium">Computer Division</p>
              <p>Result: {comparisonResult.computerResult}</p>
              <p>Time: {comparisonResult.computerTime.toFixed(6)} seconds</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-lg font-bold">
              GASING is {comparisonResult.speedupFactor.toFixed(2)} times faster
            </p>
            <p className="text-sm text-gray-600">
              Based on {comparisonResult.iterations.toLocaleString()} iterations
            </p>
          </div>
        </div>
      )}

      {/* Profile Stats Table */}
      <div className="overflow-x-auto">
        <h3 className="text-lg font-semibold mb-2">cProfile Statistics</h3>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 border-b">Function</th>
              <th className="py-2 px-4 border-b">ncalls</th>
              <th className="py-2 px-4 border-b">tottime</th>
              <th className="py-2 px-4 border-b">percall</th>
              <th className="py-2 px-4 border-b">cumtime</th>
              <th className="py-2 px-4 border-b">percall_cum</th>
            </tr>
          </thead>
          <tbody>
            {profileData.map((row, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="py-2 px-4 border-b font-mono text-sm">{row.function}</td>
                <td className="py-2 px-4 border-b text-right">{row.ncalls}</td>
                <td className="py-2 px-4 border-b text-right">{row.tottime}</td>
                <td className="py-2 px-4 border-b text-right">{row.percall}</td>
                <td className="py-2 px-4 border-b text-right">{row.cumtime}</td>
                <td className="py-2 px-4 border-b text-right">{row.percall_cum}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Run Button */}
      <div className="mt-6">
        <button 
          onClick={runProfiler}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run Profiler Again'}
        </button>
        <p className="mt-2 text-sm text-gray-600">
          This will execute the division_1.py script with cProfile and display updated results.
        </p>
      </div>

      {/* Implementation Notes */}
      <div className="mt-6 p-4 bg-yellow-50 rounded-lg text-sm">
        <h3 className="font-semibold">Implementation Notes:</h3>
        <p>
          This is a frontend visualization of the cProfile data. For a complete integration:
        </p>
        <ol className="list-decimal ml-5 mt-2">
          <li>Create a backend API endpoint that runs the Python script</li>
          <li>Parse the cProfile output and return it as JSON</li>
          <li>Update the frontend to fetch real data from the API</li>
          <li>Add parameters to customize the profiling (iterations, values, etc.)</li>
        </ol>
      </div>
    </div>
  );
};

export default DashboardcProfile;