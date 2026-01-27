import React from 'react';
import { Form, InputNumber } from 'antd';

interface RateFieldProps {
  isLadduGopalMukut: boolean;
  ladduGopalMukutRate: number;
  setLadduGopalMukutRate: (rate: number) => void;
  disabled?: boolean;
}

const RateField: React.FC<RateFieldProps> = ({
  isLadduGopalMukut,
  ladduGopalMukutRate,
  setLadduGopalMukutRate,
  disabled = false
}) => {
  return (
    <Form.Item
      name="rate"
      label="Rate Per Piece"
    >
      <InputNumber
        min={0}
        step={0.01}
        style={{ width: '100%' }}
        formatter={value => `₹ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
        parser={value => Number(String(value || '').replace(/₹\s?|(,*)/g, '')) || 0 as any}
        placeholder="Enter rate per piece"
        disabled={disabled}
        onChange={(value) => {
          if (isLadduGopalMukut) {
            setLadduGopalMukutRate(value || 0);
          }
        }}
      />
    </Form.Item>
  );
};

export default RateField;
