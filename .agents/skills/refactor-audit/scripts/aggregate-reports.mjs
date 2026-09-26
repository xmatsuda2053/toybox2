import fs from 'node:fs';
import path from 'node:path';

const projectRoot = process.cwd();
const agentsDir = path.resolve(projectRoot, '.agents');
const eslintReportPath = path.resolve(agentsDir, 'eslint-report.json');
const jscpdReportPath = path.resolve(agentsDir, 'jscpd-report.json');
const circularReportPath = path.resolve(agentsDir, 'circular-report.json');
const backlogPath = path.resolve(agentsDir, 'refactor-backlog.json');

/**
 * リポジトリルートからの相対パスに正規化する
 */
function normalizeRepoPath(filePath) {
  let normalized = filePath.replace(/\\/g, '/');
  if (path.isAbsolute(normalized)) {
    normalized = path.relative(projectRoot, normalized).replace(/\\/g, '/');
  }
  if (!normalized.startsWith('apps/') && !normalized.startsWith('packages/')) {
    if (fs.existsSync(path.resolve(projectRoot, 'apps', normalized))) {
      normalized = `apps/${normalized}`;
    } else if (fs.existsSync(path.resolve(projectRoot, 'packages', normalized))) {
      normalized = `packages/${normalized}`;
    }
  }
  return normalized;
}

/**
 * プロダクションコードに対応するテストファイルを探索する
 */
function findTestFile(targetFilePath) {
  const absPath = path.isAbsolute(targetFilePath) 
    ? targetFilePath 
    : path.resolve(projectRoot, targetFilePath);
  const parsed = path.parse(absPath);
  const testCandidate = path.join(parsed.dir, `${parsed.name}.test${parsed.ext}`);
  const specCandidate = path.join(parsed.dir, `${parsed.name}.spec${parsed.ext}`);

  if (fs.existsSync(testCandidate)) {
    return path.relative(projectRoot, testCandidate).replace(/\\/g, '/');
  }
  if (fs.existsSync(specCandidate)) {
    return path.relative(projectRoot, specCandidate).replace(/\\/g, '/');
  }
  return null;
}

const items = [];
let idCounter = 1;

// 1. ESLint レポートの集約
if (fs.existsSync(eslintReportPath)) {
  try {
    const raw = fs.readFileSync(eslintReportPath, 'utf8').replace(/^\uFEFF/, '');
    const eslintData = JSON.parse(raw);
    for (const fileReport of eslintData) {
      const relPath = normalizeRepoPath(fileReport.filePath);
      // テストファイル自体のリファクタリングは除外
      if (relPath.includes('.test.') || relPath.includes('.spec.')) {
        continue;
      }

      for (const msg of fileReport.messages) {
        let category = null;
        let summary = msg.message;
        let riskLevel = 'Low';
        let feasibility = 'High';
        const metrics = { lines: fileReport.source ? fileReport.source.split('\n').length : undefined };

        if (msg.ruleId === 'sonarjs/cognitive-complexity') {
          category = 'Complexity';
          const match = msg.message.match(/from (\d+) to the (\d+) allowed/);
          if (match) {
            metrics.cognitive_complexity = parseInt(match[1], 10);
          }
          riskLevel = 'Medium';
        } else if (msg.ruleId === 'max-lines-per-function') {
          category = 'Complexity';
          const match = msg.message.match(/has too many lines \((\d+)\)/);
          if (match) {
            metrics.function_lines = parseInt(match[1], 10);
          }
        } else if (msg.ruleId === '@typescript-eslint/no-explicit-any') {
          category = 'TypeSafety';
          summary = 'any 型の使用による型安全性の低下';
        }

        if (category) {
          const testFile = findTestFile(relPath);
          items.push({
            id: `REF-${String(idCounter++).padStart(3, '0')}`,
            target_file: relPath,
            target_symbol: `Line ${msg.line}`,
            category,
            metrics,
            issue_summary: summary,
            approach: category === 'Complexity' 
              ? '早期リターン（ガード節）の導入と関数の分割' 
              : '明示的な型定義またはジェネリクスの導入',
            scope: 'internal',
            test_status: testFile ? 'covered' : 'missing',
            test_file: testFile,
            risk_level: riskLevel,
            feasibility,
            status: 'pending',
            execution: null,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse eslint-report.json:', err.message);
  }
}

// 2. jscpd レポートの集約
if (fs.existsSync(jscpdReportPath)) {
  try {
    const raw = fs.readFileSync(jscpdReportPath, 'utf8').replace(/^\uFEFF/, '');
    const jscpdData = JSON.parse(raw);
    const duplicates = jscpdData.duplicates || [];
    for (const dup of duplicates) {
      const firstRel = normalizeRepoPath(dup.firstFile.name);
      const secondRel = normalizeRepoPath(dup.secondFile.name);

      // テストファイル間の重複や scss / json / markup は優先度を下げるか除外
      if (firstRel.includes('.test.') || secondRel.includes('.test.')) continue;
      if (!firstRel.endsWith('.ts') && !firstRel.endsWith('.tsx')) continue;

      const testFile = findTestFile(firstRel);
      items.push({
        id: `REF-${String(idCounter++).padStart(3, '0')}`,
        target_file: firstRel,
        target_symbol: `${dup.firstFile.start}-${dup.firstFile.end}`,
        category: 'Duplication',
        metrics: {
          duplicated_lines: dup.lines,
          tokens: dup.tokens,
        },
        issue_summary: `${secondRel} とのコード重複 (${dup.lines}行, ${dup.tokens}トークン)`,
        approach: '共通関数またはユーティリティパッケージへのロジック抽出・共通化',
        scope: 'internal',
        test_status: testFile ? 'covered' : 'missing',
        test_file: testFile,
        risk_level: 'Low',
        feasibility: 'High',
        status: 'pending',
        execution: null,
      });
    }
  } catch (err) {
    console.warn('Failed to parse jscpd-report.json:', err.message);
  }
}

// 3. circular レポートの集約
if (fs.existsSync(circularReportPath)) {
  try {
    const raw = fs.readFileSync(circularReportPath, 'utf8').replace(/^\uFEFF/, '');
    const circularData = JSON.parse(raw);
    if (Array.isArray(circularData)) {
      for (const cycle of circularData) {
        if (Array.isArray(cycle) && cycle.length > 0) {
          const first = cycle[0];
          const testFile = findTestFile(path.resolve(projectRoot, first));
          items.push({
            id: `REF-${String(idCounter++).padStart(3, '0')}`,
            target_file: first,
            target_symbol: 'module-import',
            category: 'CircularDependency',
            metrics: { cycle_length: cycle.length },
            issue_summary: `循環参照の検出: ${cycle.join(' -> ')}`,
            approach: '共通インターフェース・型の別モジュール分離による依存の逆転',
            scope: 'internal',
            test_status: testFile ? 'covered' : 'missing',
            test_file: testFile,
            risk_level: 'High',
            feasibility: 'Medium',
            status: 'pending',
            execution: null,
          });
        }
      }
    }
  } catch (err) {
    console.warn('Failed to parse circular-report.json:', err.message);
  }
}

// 既存のバックログが存在する場合は完全保持し、最大IDを特定して蓄積マージを行う
let backlogItems = [];
let maxId = 0;
const existingKeys = new Set();

if (fs.existsSync(backlogPath)) {
  try {
    const raw = fs.readFileSync(backlogPath, 'utf8').replace(/^\uFEFF/, '');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      backlogItems = parsed;
      for (const item of backlogItems) {
        const match = item.id?.match(/REF-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxId) maxId = num;
        }
        existingKeys.add(`${item.target_file}::${item.category}::${item.issue_summary}`);
      }
    }
  } catch (err) {
    console.warn('Failed to parse existing refactor-backlog.json:', err.message);
  }
}

let nextId = maxId + 1;
let addedCount = 0;

// 新規に検出された問題のみを既存バックログの末尾に追記マージする
for (const detected of items) {
  const key = `${detected.target_file}::${detected.category}::${detected.issue_summary}`;
  if (!existingKeys.has(key)) {
    detected.id = `REF-${String(nextId++).padStart(3, '0')}`;
    backlogItems.push(detected);
    existingKeys.add(key);
    addedCount++;
  }
}

fs.writeFileSync(backlogPath, JSON.stringify(backlogItems, null, 2), 'utf8');
console.log(`Backlog updated: ${backlogItems.length} total items (${addedCount} newly added, ${backlogItems.length - addedCount} preserved) at ${backlogPath}`);

