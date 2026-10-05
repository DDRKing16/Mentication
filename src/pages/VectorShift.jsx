import React from "react";
import { Navigate } from "react-router-dom";

// Direct entry uses the same explicitly answered baseline and completion path.
export default function VectorShift() {
  return <Navigate to="/reset" replace state={{ prebuilt:true, pathway:["vectorShift"], direction:"ground", directionLabel:"Ground", whereFelt:"both", timeMin:5 }} />;
}
