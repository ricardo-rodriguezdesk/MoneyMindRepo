import { CheckIcon } from './icons.jsx';

/** Indicador de 2 pasos: 1. Solicitar enlace · 2. Nueva contraseña */
export default function Stepper({ step }) {
  return (
    <ol className="stepper" aria-label="Progreso">
      <li className={step === 1 ? 'current' : 'done'}>
        <span className="step-dot">{step > 1 && <CheckIcon size={12} />}</span>
        1. Solicitar enlace
      </li>
      <li className={step === 2 ? 'current' : ''}>
        <span className="step-dot" />
        2. Nueva contraseña
      </li>
    </ol>
  );
}
