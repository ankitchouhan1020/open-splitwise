export type SplitwiseUser = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  default_currency: string;
  registration_status?: string;
};

export type SplitwiseCurrentUserResponse = {
  user: SplitwiseUser;
};

export type SplitwiseTokenResponse = {
  access_token: string;
  token_type: string;
};
