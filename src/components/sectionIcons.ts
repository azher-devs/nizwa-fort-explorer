import { Castle, CircleDot, DoorOpen, Landmark, MapPin, Shield, Warehouse, Waves } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { FortSection } from '../data/sections'

export const sectionIcons: Record<FortSection['icon'], LucideIcon> = {
  tower: Castle,
  gate: DoorOpen,
  well: Waves,
  council: Landmark,
  wall: Shield,
  room: Warehouse,
  cannon: CircleDot,
  passage: MapPin,
}
