for file in src/components/script/MasterScriptTable.tsx src/components/prompts/PromptHub.tsx src/components/settings/ThemeCustomizer.tsx; do
  sed -i 's/bg-white border border-slate-200/backdrop-blur-xl bg-slate-900\/60 border border-white\/10 shadow-2xl/g' $file
  sed -i 's/bg-white/bg-slate-900\/40/g' $file
  sed -i 's/text-slate-800/text-white/g' $file
  sed -i 's/text-slate-700/text-slate-200/g' $file
  sed -i 's/text-slate-600/text-slate-300/g' $file
  sed -i 's/text-slate-500/text-slate-400/g' $file
  sed -i 's/bg-slate-50/bg-slate-800\/50/g' $file
  sed -i 's/bg-slate-100/bg-slate-800/g' $file
  sed -i 's/bg-slate-200/bg-slate-700/g' $file
  sed -i 's/border-slate-100/border-white\/5/g' $file
  sed -i 's/border-slate-200/border-white\/10/g' $file
  sed -i 's/border-slate-300/border-white\/20/g' $file
done
