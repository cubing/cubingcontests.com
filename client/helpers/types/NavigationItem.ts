export type NavigationItem = {
  title: string;
  shortTitle?: string;
  value: string;
  route?: string;
  getIsActive?: (pathname: string) => boolean;
  hidden?: boolean;
};
