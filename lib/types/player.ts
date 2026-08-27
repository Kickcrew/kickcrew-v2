export interface Player {
  id: number

  full_name: string | null
  gamer_tag: string | null

  email: string | null
  phone: string | null

  team_id: number | null

  game: string | null
  role: string | null
  rank: string | null
  country: string | null

  status: string | null

  bio: string | null
  profile_photo: string | null

  applicant_id: number | null
}


export type PlayerSummary = Pick<
  Player,
  "id" | "full_name" | "gamer_tag"
>


export interface PlayerWithTeam extends Player {
  teams?: {
    team_name: string
  } | null
}