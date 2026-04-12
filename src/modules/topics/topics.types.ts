export interface CreateTopicsDto {
  label: string;
  slug?: string;
  createdBy: string;
}

export interface UpdateTopicsDto {
  label: string;
}
