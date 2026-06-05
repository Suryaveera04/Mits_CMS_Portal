// src/components/common/Avatar.jsx
import styles from './Avatar.module.css';

const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#f093fb', '#f5576c'],
];

function gradient(name = '') {
  const safeName = name || 'A';
  const [c1, c2] = GRADIENTS[safeName.charCodeAt(0) % GRADIENTS.length];
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}

export default function Avatar({ name, avatar, size = 40, className = '' }) {
  const initials = (name || '?')
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // When size is provided, use it explicitly; CSS width/height:100% acts as fallback
  const style = {
    width: size,
    height: size,
    minWidth: size,
    minHeight: size,
    fontSize: Math.round(size * 0.33),
    background: avatar ? undefined : gradient(name),
  };

  return (
    <div className={`${styles.avatar} ${className}`} style={style}>
      {avatar
        ? <img src={avatar} alt={name || ''} className={styles.img} />
        : initials}
    </div>
  );
}
