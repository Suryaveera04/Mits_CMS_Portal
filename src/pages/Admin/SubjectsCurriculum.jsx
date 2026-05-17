// src/pages/Admin/SubjectsCurriculum.jsx
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../context/DataContext';
import { Button, FormField, Input } from '../../components/common/UI';
import styles from './SubjectsCurriculum.module.css';

function groupSubjects(subjects, dept) {
  const filtered = dept ? subjects.filter(s => s.department === dept) : subjects;
  const regs = {};
  filtered.forEach(s => {
    const r = s.regulation || 'Unspecified';
    const y = s.academicYear || 'Unspecified';
    const sem = s.semester || 'Unspecified';
    regs[r] = regs[r] || {};
    regs[r][y] = regs[r][y] || {};
    regs[r][y][sem] = regs[r][y][sem] || [];
    regs[r][y][sem].push(s);
  });
  return regs;
}

export default function SubjectsCurriculum({ department }) {
  const { subjects, deleteSubject, addSubject } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filterReg, setFilterReg] = useState('All');
  const [filterYear, setFilterYear] = useState('All');
  const [filterSem, setFilterSem] = useState('All');

  const regs = useMemo(() => groupSubjects(subjects, department), [subjects, department]);

  const regsList = useMemo(() => ['All', ...Object.keys(regs)], [regs]);

  const yearsList = useMemo(() => {
    const set = new Set();
    subjects.forEach(s => s.academicYear && set.add(s.academicYear));
    return ['All', ...Array.from(set)];
  }, [subjects]);

  const semsList = useMemo(() => {
    const set = new Set();
    subjects.forEach(s => s.semester && set.add(s.semester));
    return ['All', ...Array.from(set)];
  }, [subjects]);

  const handleDelete = (id) => {
    if (!confirm('Delete this subject?')) return;
    deleteSubject(id);
  };

  const handleBulk = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target.result;
      const rows = text.split(/\r?\n/).map(r => r.trim()).filter(Boolean);
      const headers = rows[0].split(',').map(h => h.trim());
      for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',').map(c => c.trim());
        const obj = {};
        headers.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
        const payload = {
          name: obj['Subject Name'] || obj['Name'] || obj['Subject'] || '',
          code: obj['Subject Code'] || obj['Code'] || '',
          type: obj['Type'] || '',
          credits: obj['Credits'] || '',
          regulation: obj['Regulation'] || '',
          department: obj['Department'] || department || '',
          academicYear: obj['Academic Year'] || obj['Year'] || '',
          semester: obj['Semester'] || '',
          faculty: obj['Faculty'] || '',
        };
        try { await addSubject(payload); } catch (e) { /* continue */ }
      }
      alert('Bulk import complete');
    };
    reader.readAsText(file);
  };

  return (
    <div className={styles.root}>
      <div className={styles.toolbar}>
        <div className={styles.leftControls}>
          <FormField>
            <Input placeholder="Search subject name or code" value={search} onChange={e => setSearch(e.target.value)} />
          </FormField>
          <select className={styles.select} value={filterReg} onChange={e => setFilterReg(e.target.value)}>
            {regsList.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className={styles.select} value={filterYear} onChange={e => setFilterYear(e.target.value)}>
            {yearsList.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          <select className={styles.select} value={filterSem} onChange={e => setFilterSem(e.target.value)}>
            {semsList.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className={styles.rightControls}>
          <input id="bulkCsv" style={{ display: 'none' }} type="file" accept=".csv" onChange={e => handleBulk(e.target.files[0])} />
          <label htmlFor="bulkCsv"><Button variant="ghost">Bulk CSV</Button></label>
          <Button onClick={() => navigate('/content/edit?type=Subject')}>Add Subject</Button>
        </div>
      </div>

      <div className={styles.curriculumWrap}>
        {Object.keys(regs).length === 0 && <div className={styles.empty}>No subjects found.</div>}
        {Object.keys(regs).filter(r => filterReg === 'All' || r === filterReg).map(reg => (
          <div key={reg} className={styles.regBlock}>
            <h2 className={styles.regTitle}>Regulation: {reg}</h2>
            {Object.keys(regs[reg]).filter(y => filterYear === 'All' || y === filterYear).map(year => (
              <div key={year} className={styles.yearBlock}>
                <h3 className={styles.yearTitle}>{year}</h3>
                {Object.keys(regs[reg][year]).filter(sem => filterSem === 'All' || sem === filterSem).map(sem => {
                  const rows = regs[reg][year][sem].filter(s => {
                    if (!search) return true;
                    const q = search.toLowerCase();
                    return (s.name || '').toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q);
                  });
                  return (
                    <div key={sem} className={styles.semBlock}>
                      <div className={styles.semHeader}>{`${year} - ${sem}`}</div>
                      <div className={styles.tableWrap}>
                        <table className={styles.table}>
                          <thead>
                            <tr>
                              <th style={{ width: 60 }}>S.No</th>
                              <th>Name of the Subject</th>
                              <th style={{ width: 110 }}>Type</th>
                              <th style={{ width: 90 }}>Credits</th>
                              <th style={{ width: 120 }}>Subject Code</th>
                              <th style={{ width: 160 }}>Faculty</th>
                              <th style={{ width: 120 }}>Download</th>
                              <th style={{ width: 110 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {rows.length === 0 && (
                              <tr><td colSpan={8} className={styles.emptyRow}>No subjects in this semester</td></tr>
                            )}
                            {rows.map((s, idx) => (
                              <tr key={s._id || s.id}>
                                <td>{idx + 1}</td>
                                <td className={styles.subName}>{s.name}</td>
                                <td>{s.type}</td>
                                <td>{s.credits}</td>
                                <td>{s.code}</td>
                                <td>{s.faculty || '-'}</td>
                                <td>
                                  {s.syllabusUrl && <a className={styles.download} href={s.syllabusUrl} target="_blank" rel="noreferrer">Syllabus</a>}
                                  {s.notesUrl && <><span> </span><a className={styles.download} href={s.notesUrl} target="_blank" rel="noreferrer">Notes</a></>}
                                </td>
                                <td>
                                  <button className={styles.actionBtn} onClick={() => navigate(`/content/edit?type=Subject&id=${s._id || s.id}`)}>Edit</button>
                                  <button className={styles.actionBtnDel} onClick={() => handleDelete(s._id || s.id)}>Delete</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
