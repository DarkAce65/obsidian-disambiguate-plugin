import { JSX, ParentProps } from 'solid-js';

function FormControl(props: ParentProps<{ label: string }>): JSX.Element {
  return (
    <label style={{ display: 'flex', 'align-items': 'center', gap: '12px' }}>
      <span style={{ 'flex-basis': '100px' }}>{props.label}</span>
      <div style={{ 'flex-grow': 1 }}>{props.children}</div>
    </label>
  );
}

export default FormControl;
