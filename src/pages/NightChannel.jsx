import { useNavigate } from "react-router-dom";
import { NightChannelExperience } from "@/components/NewFlagshipExperiences";
import { INTERVENTIONS } from "@/lib/interventions";

const intervention = INTERVENTIONS.find(({ id }) => id === "nightChannel");

export default function NightChannel() {
  const navigate = useNavigate();

  return (
    <NightChannelExperience
      intervention={intervention}
      onExit={() => navigate("/library")}
    />
  );
}
