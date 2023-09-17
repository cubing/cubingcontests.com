export interface INavigationItem {
  title: string;
  value: string;
  route?: string;
  getIsActive?: (pathname: string) => boolean;
  hidden?: boolean;
}
