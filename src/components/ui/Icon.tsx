import download from "@/assets/icons/download.svg?react";
import chevronDown from "@/assets/icons/chevron-down.svg?react";
import pencil from "@/assets/icons/pencil.svg?react";
import check from "@/assets/icons/check.svg?react";
import donut from "@/assets/icons/donut.svg?react";
import circle from "@/assets/icons/circle.svg?react";
import type { SVGProps } from "react";

const iconList = {
  download,
  chevronDown,
  pencil,
  check,
  donut,
  circle,
} as const;

type IconName = keyof typeof iconList;

// name이 API 응답 등 외부 입력(string)으로 넓어지는 경우,
// isIconName(name) 타입 가드를 추가하고 false면 null을 반환해야 한다.
interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

function Icon({ name, ...props }: IconProps) {
  const SVGIcon = iconList[name];
  return <SVGIcon {...props} />;
}

export default Icon;
