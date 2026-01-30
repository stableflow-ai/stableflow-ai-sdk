import type { ChangeEvent, DetailedHTMLProps, InputHTMLAttributes } from 'react';

const InputNumber = (props: Props) => {
  const { onChange, onNumberChange, decimals, ...restProps } = props;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let temp = e.target.value;
    if (temp) {
      temp = temp.replace(/[^\d.]/g, '');

      if (temp && temp.length && temp.indexOf('.') !== temp.lastIndexOf('.')) {
        const arr = temp.split('.');
        let first = arr.shift();
        temp = first + '.' + arr.join('');
      }

      while (/^0[0-9]/.test(temp)) {
        temp = temp.substring(1);
      }

      if (temp === '.') temp = '';

      if (decimals !== undefined && temp.includes('.')) {
        const parts = temp.split('.');
        if (parts[1] && parts[1].length > decimals) {
          parts[1] = parts[1].substring(0, decimals);
          temp = parts.join('.');
        }
      }
    }
    e.target.value = temp;
    onChange?.(e);
    onNumberChange?.(temp);
  };

  return (
    <input
      {...restProps}
      type="text"
      inputMode="decimal"
      onChange={handleChange}
    />
  );
};

export default InputNumber;

interface Props extends DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  onNumberChange?(value: string): void;
  decimals?: number;
}
