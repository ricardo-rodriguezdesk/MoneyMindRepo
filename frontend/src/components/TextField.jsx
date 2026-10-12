import { useState } from 'react';
import { EyeIcon, EyeOffIcon } from './icons.jsx';

/** Campo con ícono, y estado visual: verde si es válido, rojo con mensaje si no. */
export default function TextField({ label, name, icon, right, error, valid, ...inputProps }) {
  const state = error ? 'invalid' : valid ? 'valid' : '';
  return (
    <div className={`field ${state}`}>
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        {icon && <span className="input-icon">{icon}</span>}
        <input id={name} name={name} {...inputProps} />
        {right}
      </div>
      {error && (
        <p className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Campo de contraseña con el ojo para mostrar/ocultar. */
export function PasswordField({ icon, ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      {...props}
      icon={icon}
      type={visible ? 'text' : 'password'}
      right={
        <button
          className="eye"
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      }
    />
  );
}
