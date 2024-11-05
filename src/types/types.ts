export interface IUser {
  id: string;
  email: string;
}
export interface IGetUser {
  _id: string;
  name: string;
  email: string;
  avatar: string;
}
export interface IUpdateUser extends IGetUser {}
