import React, { useEffect, useState } from 'react';
import { profileAPI } from '../../services/api'; // assuming API helper

const HodLogin = () => {
  const [hod, setHod] = useState({ name: '', designation: '', qualification: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHod = async () => {
      try {
        const data = await profileAPI.get('hod'); // placeholder endpoint
        setHod({
          name: data.name || '',
          designation: data.designation || '',
          qualification: data.qualification || ''
        });
      } catch (e) {
        setError('Failed to load HOD details');
      } finally {
        setLoading(false);
      }
    };
    fetchHod();
  }, []);

  if (loading) return <p>Loading HOD details...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="hod-login-details">
      <h2>HOD Profile</h2>
      <div className="field">
        <label>Name:</label>
        <input type="text" value={hod.name} readOnly />
      </div>
      <div className="field">
        <label>Designation:</label>
        <input type="text" value={hod.designation} readOnly />
      </div>
      <div className="field">
        <label>Qualification:</label>
        <input type="text" value={hod.qualification} readOnly />
      </div>
    </div>
  );
};

export default HodLogin;
