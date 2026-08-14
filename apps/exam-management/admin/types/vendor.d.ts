// Ambient declarations for untyped vendor packages.
//
// @exxatdesignux/product-framework ships as plain JS without bundled types.
// The multi-product authoring/shell modules (lib/product-*.ts, stores/app-store)
// imported from it are DS-template scaffolding; declare the module so the live
// tree typechecks instead of failing TS7016 (implicit-any module).
declare module '@exxatdesignux/product-framework'
declare module '@exxatdesignux/product-framework/vite/exxat-builder-dev-sync'
