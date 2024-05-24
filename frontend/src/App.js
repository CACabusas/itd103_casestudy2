import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [timestamps, setTimestamps] = useState([]);
  const [filteredDates, setFilteredDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [sortOrder, setSortOrder] = useState('asc'); // Default sort order
  const [chartData, setChartData] = useState([]);
  const ws = new WebSocket('ws://localhost:3001');

  useEffect(() => {
    axios.get('http://localhost:3001/motion/')
      .then(res => {
        setTimestamps(res.data);
        setFilteredDates(res.data);
        generateChartData(res.data);
      })
      .catch(err => console.log(err));

    ws.onmessage = (event) => {
      const newMotionEvent = JSON.parse(event.data);
      setTimestamps(prevTimestamps => [...prevTimestamps, newMotionEvent]);
      setFilteredDates(prevFilteredDates => [...prevFilteredDates, newMotionEvent]);
      generateChartData([...timestamps, newMotionEvent]);
    };

    return () => ws.close();
  }, []);

  const handleDelete = (id) => {
    axios.delete(`http://localhost:3001/motion/deletemotion/${id}`)
      .then(res => {
        console.log(res);
        // Update timestamps after deletion
        const updatedTimestamps = timestamps.filter(t => t._id !== id);
        setTimestamps(updatedTimestamps);
        setFilteredDates(updatedTimestamps);
        generateChartData(updatedTimestamps);
      })
      .catch(err => console.log(err));
  };

  const handleFilterChange = (e) => {
    setSelectedDate(e.target.value);
    if (e.target.value) {
      const filtered = timestamps.filter(t => new Date(t.timestamp).toDateString() === e.target.value);
      setFilteredDates(filtered);
      generateChartData(filtered);
    } else {
      setFilteredDates(timestamps);
      generateChartData(timestamps);
    }
  };

  const handleSortChange = (order) => {
    setSortOrder(order);
    const sorted = [...filteredDates].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    if (order === 'desc') sorted.reverse(); // Reverse for descending order
    setFilteredDates(sorted);
  };

  const generateChartData = (data) => {
    const counts = {};
    data.forEach(timestamp => {
      const hour = new Date(timestamp.timestamp).getHours();
      counts[hour] = counts[hour] ? counts[hour] + 1 : 1;
    });
    const chartData = Object.keys(counts).map(hour => ({
      hour: `${hour}:00`,
      count: counts[hour]
    }));
    setChartData(chartData);
  };

  const uniqueDates = [...new Set(timestamps.map(t => new Date(t.timestamp).toDateString()))];

  return (
    <div className="d-flex vh-100 bg-black justify-content-center align-items-center">
      <div className="w-75 bg-white rounded p-4 shadow-sm">
        <h2 className="text-center mb-4">Motion Detection Log</h2>
        <div className="mb-4">
          <label htmlFor="dateFilter" className="form-label">Filter by Date:</label>
          <select id="dateFilter" onChange={handleFilterChange} value={selectedDate} className="form-select">
            <option value="">All Dates</option>
            {uniqueDates.map((date, index) => (
              <option key={index} value={date}>{date}</option>
            ))}
          </select>
        </div>
        <div className="d-flex justify-content-between mb-3">
          <button onClick={() => handleSortChange(sortOrder === 'asc' ? 'desc' : 'asc')} className="btn btn-primary">
            Sort {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
          </button>
        </div>
        <table className="table table-striped">
          <thead className="table-dark">
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredDates.map((timestamp, index) => (
              <tr key={index}>
                <td>{new Date(timestamp.timestamp).toLocaleString()}</td>
                <td>
                  <button onClick={() => handleDelete(timestamp._id)} className="btn btn-sm btn-danger">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5">
          <h2 className="text-center">Motion Detection per Hour</h2>
          <BarChart
            width={600}
            height={300}
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            className="mx-auto"
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" />
          </BarChart>
        </div>
      </div>
    </div>
  );
}

export default App;