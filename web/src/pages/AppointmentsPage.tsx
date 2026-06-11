import React, { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import { Link } from 'react-router-dom';

export const AppointmentsPage = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  
  // Formulaire
  const [vehicleId, setVehicleId] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchData = async () => {
    try {
      const [resApts, resVeh] = await Promise.all([
        apiClient.get('/appointments'),
        apiClient.get('/vehicles')
      ]);
      setAppointments(resApts.data);
      setVehicles(resVeh.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/appointments', {
        vehicle_id: parseInt(vehicleId),
        start_time: startTime,
        end_time: endTime,
        status: 'scheduled'
      });
      fetchData(); // Refresh
    } catch (err) { alert("Erreur lors de la prise de RDV"); }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Dashboard</Link>
      <h1>📅 Planning des Rendez-vous</h1>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Prendre un nouveau RDV</h3>
        <form onSubmit={handleAdd}>
          <select value={vehicleId} onChange={e => setVehicleId(e.target.value)} required>
            <option value="">-- Choisir un véhicule --</option>
            {vehicles.map(v => <option key={v.id} value={v.id}>{v.immatriculation} ({v.marque})</option>)}
          </select>
          <label style={{marginLeft: '10px'}}>Début: </label>
          <input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} required />
          <label style={{marginLeft: '10px'}}>Fin: </label>
          <input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} required />
          <button type="submit" style={{marginLeft: '15px'}}>Planifier</button>
        </form>
      </div>

      <table border={1} cellPadding={10} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ backgroundColor: '#f4f4f4' }}>
          <tr>
            <th>Date / Heure</th>
            <th>Véhicule</th>
            <th>Statut</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map(a => (
            <tr key={a.id}>
              <td>Du {new Date(a.start_time).toLocaleString()} au {new Date(a.end_time).toLocaleTimeString()}</td>
              <td>Véhicule #{a.vehicle_id}</td>
              <td><span style={{padding: '5px', borderRadius: '4px', backgroundColor: '#fff3cd'}}>{a.status}</span></td>
              <td><button disabled>Ouvrir Fiche Atelier</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
