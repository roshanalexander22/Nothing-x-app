fn main() {
    #[cfg(windows)]
    if std::env::var("CARGO_CFG_TARGET_ENV").as_deref() == Ok("gnu") {
        if let Ok(out_dir) = std::env::var("OUT_DIR") {
            let specs_path = std::path::Path::new(&out_dir).join("no-manifest.specs");
            let specs = "*endfile:\n\
%{mdaz-ftz:crtfastmath.o%s;Ofast|ffast-math|funsafe-math-optimizations:%{!shared:%{!mno-daz-ftz:crtfastmath.o%s}}} %{fvtable-verify=none:%s; fvtable-verify=preinit:vtv_end.o%s; fvtable-verify=std:vtv_end.o%s} crtend.o%s\n";
            if std::fs::write(&specs_path, specs).is_ok() {
                println!(
                    "cargo:rustc-link-arg-bins=-specs={}",
                    specs_path.display()
                );
            }
        }
    }

    tauri_build::build()
}
