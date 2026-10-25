import VisibilityIcon from '@mui/icons-material/Visibility'
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import TextField, { type TextFieldProps } from '@mui/material/TextField'
import { forwardRef, useState } from 'react'

/** Password input with a show/hide toggle. Accepts react-hook-form's register() props. */
export const PasswordField = forwardRef<HTMLInputElement, TextFieldProps>(
  function PasswordField(props, ref) {
    const [visible, setVisible] = useState(false)

    return (
      <TextField
        {...props}
        inputRef={ref}
        type={visible ? 'text' : 'password'}
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={visible ? 'Hide password' : 'Show password'}
                  onClick={() => setVisible((v) => !v)}
                  edge="end"
                >
                  {visible ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </InputAdornment>
            ),
          },
        }}
      />
    )
  },
)
