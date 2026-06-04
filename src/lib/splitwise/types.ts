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

export type SplitwiseExpenseUser = {
  user_id: number;
  paid_share: string;
  owed_share: string;
  net_balance?: string;
  user?: {
    id: number;
    first_name?: string;
    last_name?: string;
  };
};

export type SplitwiseExpense = {
  id: number;
  group_id: number;
  friendship_id: number | null;
  cost: string;
  currency_code: string;
  category_id: number | null;
  description: string;
  details: string | null;
  date: string;
  payment: boolean;
  deleted_at: string | null;
  updated_at: string;
  created_at: string;
  users: SplitwiseExpenseUser[];
  category?: { id: number; name: string } | null;
};

export type SplitwiseExpensesResponse = {
  expenses: SplitwiseExpense[];
};

export type SplitwiseGroup = {
  id: number;
  name: string;
  group_type: string | null;
  updated_at: string | null;
};

export type SplitwiseGroupsResponse = {
  groups: SplitwiseGroup[];
};

export type SplitwiseFriend = {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  updated_at: string | null;
};

export type SplitwiseFriendsResponse = {
  friends: SplitwiseFriend[];
};

export type SplitwiseCategory = {
  id: number;
  name: string;
  subcategories?: SplitwiseCategory[];
};

export type SplitwiseCategoriesResponse = {
  categories: SplitwiseCategory[];
};
