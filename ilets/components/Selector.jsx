import * as React from "react";
import Box from "@mui/material/Box";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

export default function Selector(props) {
  const [TargetedBandScore, setTargetedBandScore] = React.useState("");

  const handleChange = (event) => {
    setTargetedBandScore(event.target.value);
    props.setScore(event.target.value)
  };
  const numbers = [
    { value: 6, label: "Six" },
    { value: 7, label: "Seven" },
    { value: 8, label: "Eight" },
    { value: 9, label: "Nine" },
  ];
  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Targeted Band Score</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={TargetedBandScore}
          label="Targeted Band Score"
          onChange={handleChange}
        >
          {numbers.map((number) => (
            <MenuItem key={number.value} value={number.value}>
              {number.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}
