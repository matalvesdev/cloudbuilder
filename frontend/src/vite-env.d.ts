/// <reference types="vite/client" />

declare module "dagre" {
  const dagre: {
    graphlib: {
      Graph: new () => any;
    };
    layout: (graph: any) => void;
  };
  export default dagre;
}
