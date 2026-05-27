import download from "@/assets/icons/download.svg?react";
import chevronDown from "@/assets/icons/chevron-down.svg?react";
import pencil from "@/assets/icons/pencil.svg?react";
import check from "@/assets/icons/check.svg?react";
import donut from "@/assets/icons/donut.svg?react";
import circle from "@/assets/icons/circle.svg?react";
import type { ComponentType, SVGProps } from "react";

const iconList = {
  download,
  chevronDown,
  pencil,
  check,
  donut,
  circle,
} as const;

type IconName = keyof typeof iconList;
type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
  className?: string;
}

function Icon({ name, className, ...props }: IconProps) {
  const SVGIcon: IconComponent | undefined = iconList[name];

  if (!SVGIcon) {
    return null;
  }

  return <SVGIcon className={className ?? undefined} {...props} />;
}

export default Icon;
