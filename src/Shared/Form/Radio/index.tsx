import React from 'react'
import cn from 'classnames'
import { Check } from '@styled-icons/boxicons-regular/Check'

type Props = {
  checked: boolean
  onChange(e: any): void
  name: string
  value: string
  size?: number
  label?: string
  classes?: {
    root?: string
    label?: string
    input?: string
  }
}

export default function Radio({
  checked,
  onChange,
  name,
  value,
  label,
  classes = {},
  size = 16,
}: Props) {
  return (
    <label className={classes.root}>
      <div className={classes.label}>{label}</div>
      <div
        className={cn(
          'rounded-full border overflow-hidden duration-200 transition flex-center text-white',
          checked
            ? 'bg-blue-primary border-blue-primary'
            : 'bg-white border-black',
          classes.input,
        )}
        style={{ width: `${size}px`, height: `${size}px` }}
      >
        <input
          type="radio"
          value={value}
          name={name}
          checked={checked}
          onChange={onChange}
          hidden
        />
        <Check size={24} />
      </div>
    </label>
  )
}
