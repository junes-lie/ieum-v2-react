import React from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowLeft, faMagnifyingGlass, faPlay, faPause, faStop,
  faMicrophone, faPlus, faCheck, faShareNodes, faHouse,
  faFolderOpen, faUser, faSliders, faHeadphones, faXmark,
  faArrowDownWideShort, faRotateLeft, faCircleInfo,
  faHeart as solidHeart, faStar as solidStar, faBookmark as solidBookmark
} from '@fortawesome/free-solid-svg-icons'
import { faHeart, faStar, faBookmark } from '@fortawesome/free-regular-svg-icons'

export const FUNCTIONAL_ICONS = Object.freeze({
  back: faArrowLeft,
  search: faMagnifyingGlass,
  play: faPlay,
  pause: faPause,
  stop: faStop,
  mic: faMicrophone,
  plus: faPlus,
  check: faCheck,
  share: faShareNodes,
  heart: faHeart,
  star: faStar,
  home: faHouse,
  folder: faFolderOpen,
  projects: faFolderOpen,
  bookmark: faBookmark,
  collection: faBookmark,
  user: faUser,
  my: faUser,
  sliders: faSliders,
  headphones: faHeadphones,
  close: faXmark,
  sort: faArrowDownWideShort,
  retry: faRotateLeft,
  info: faCircleInfo
})
const SELECTED_ICONS = { heart: solidHeart, star: solidStar, bookmark: solidBookmark, collection: solidBookmark }

// Buttons own accessible labels and touch targets; these SVGs are decorative.
export default function Icon({ name, size = 20, filled = false, className, style }) {
  const icon = filled ? SELECTED_ICONS[name] || FUNCTIONAL_ICONS[name] : FUNCTIONAL_ICONS[name]
  if (!icon) return null
  return <FontAwesomeIcon icon={icon} aria-hidden="true" focusable="false" className={className} style={{ width: size, height: size, flexShrink: 0, ...style }}/>
}
