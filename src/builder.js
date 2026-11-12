function buildForm() {
  const form = FormApp.create(CONFIG.title);
  form.setIsQuiz(true)
      .setShuffleQuestions(true)
      .setProgressBar(true);

  // 1. Petunjuk
  form.addSectionHeaderItem().setTitle('Petunjuk').setHelpText(CONFIG.instructions);

  // 2. Pilih kelas (pilihan diisi nanti, setelah section nama dibuat)
  form.addPageBreakItem().setTitle('Pilih Kelas');
  const classItem = form.addMultipleChoiceItem().setTitle('Kelas').setRequired(true);

  // 3. Satu section nama per kelas
  const namePages = {};
  Object.keys(CONFIG.classes).forEach(kelas => {
    namePages[kelas] = form.addPageBreakItem().setTitle('Pilih Nama: ' + kelas);
    form.addListItem()
        .setTitle('Nama (' + kelas + ')')
        .setChoiceValues(CONFIG.classes[kelas])
        .setRequired(true);
  });

  // 4. Token
  const tokenPage = form.addPageBreakItem().setTitle('Token Ujian');
  const validation = FormApp.createTextValidation()
      .setHelpText('Token salah.')
      .requireTextMatchesPattern('^' + CONFIG.token + '$')
      .build();
  form.addTextItem().setTitle('Masukkan token').setRequired(true).setValidation(validation);

  // 5. Soal (semua di satu section agar teracak bersama)
  form.addPageBreakItem().setTitle('Soal Ujian');
  QUESTIONS.forEach(q => addQuestion_(form, q));

  // Sambungkan percabangan
  classItem.setChoices(
    Object.keys(CONFIG.classes).map(k => classItem.createChoice(k, namePages[k]))
  );
  Object.values(namePages).forEach(p => p.setGoToPage(tokenPage));

  Logger.log('Edit : ' + form.getEditUrl());
  Logger.log('Siswa: ' + form.getPublishedUrl());
}

function addQuestion_(form, q) {
  let item;
  if (q.type === 'PGK') {
    item = form.addCheckboxItem();
    item.setChoices(q.options.map((o, i) => item.createChoice(o, q.answer.includes(i))));
  } else {
    item = form.addMultipleChoiceItem();
    const opts = q.type === 'BS' ? ['Benar', 'Salah'] : q.options;
    const correct = q.type === 'BS' ? (q.answer ? 0 : 1) : q.answer;
    item.setChoices(opts.map((o, i) => item.createChoice(o, i === correct)));
  }
  item.setTitle(q.text).setRequired(true).setPoints(CONFIG.points[q.type]);
  if (q.explanation) {
    item.setFeedbackForIncorrect(FormApp.createFeedback().setText(q.explanation).build());
  }
}
