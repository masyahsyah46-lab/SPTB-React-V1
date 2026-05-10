import * as pdfjs from 'pdfjs-dist';

// Use CDN for worker to ensure stability in multiple environments
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export const pdfProcessor = {
  async extractText(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  },

  extractDataSimple(pdfText: string) {
    const extractedData: any = {
      companyName: '',
      cidbNumber: '',
      grade: '',
      spkkStartDate: '',
      spkkEndDate: '',
      stbStartDate: '',
      stbEndDate: '',
      directors: [],
      shareholders: [],
      spkkPersons: [],
      chequeSignatories: [],
      phoneNumbers: [],
      alamatPerniagaan: ''
    };

    const rawText = pdfText.toUpperCase().replace(/\s+/g, ' ');
    const cleanHeaderText = rawText.replace(/TEL\s*:\s*[\d-]+\s*/g, '');

    const companyMatch = cleanHeaderText.match(/([A-Z0-9\s\.\&\-]+?)\s*\(\d{6,}[-\s]?[A-Z0-9]+\)/);
    if (companyMatch && companyMatch[1]) {
      let name = companyMatch[1].trim();
      name = name.replace(/.*(?:ADDR|ALAMAT|LUMPUR|SELANGOR|JOHOR|KUALA)[:\s]*/, '').trim();
      extractedData.companyName = name;
    }

    const cidbMatch = rawText.match(/(\d{6,}-[A-Z]{2,}\d{5,})/);
    if (cidbMatch) extractedData.cidbNumber = cidbMatch[1];
    
    const gradeMatches = rawText.match(/\b(G[1-7])\b/gi);
    if (gradeMatches && gradeMatches.length > 0) {
      extractedData.grade = gradeMatches[0].toUpperCase();
    }

    const spkkMatch = rawText.match(/KERJA KERAJAAN \(SPKK\)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})/);
    if (spkkMatch) { 
      extractedData.spkkStartDate = spkkMatch[1]; 
      extractedData.spkkEndDate = spkkMatch[2]; 
    }

    const stbMatch = rawText.match(/TARAF BUMIPUTERA \(STB\)\s*(\d{2}\/\d{2}\/\d{4})\s*(\d{2}\/\d{2}\/\d{4})/);
    if (stbMatch) { 
      extractedData.stbStartDate = stbMatch[1]; 
      extractedData.stbEndDate = stbMatch[2]; 
    }
    
    const phoneRegex = /(?:TEL|H\/P|PHONE)[\s:]*([\d\s\-\(\)\+]+)/gi;
    let phoneMatch;
    const phones = new Set<string>();
    while ((phoneMatch = phoneRegex.exec(rawText)) !== null) {
      let phoneNum = phoneMatch[1].trim();
      phoneNum = phoneNum.replace(/\s+/g, '');
      if (phoneNum.length >= 6) {
        phones.add(phoneNum);
      }
    }
    extractedData.phoneNumbers = Array.from(phones);

    const sanitizeName = (rawName: string) => {
      let name = rawName.trim();
      const cutOffWords = [
        " PENGARAH", " PENGURUS", " MANAGER", " SECRETARY", " SETIAUSAHA",
        " PEMEGANG", " SAHAM", " SHARES", " EKUITI", " EQUITY",
        " LEMBAGA", " JAWATAN", " POSITION", " APPOINTMENT", " LANTIKAN", 
        " WARGANEGARA", " MALAYSIA", " MELAYU", " LELAKI", " PEREMPUAN",
        " NO.", " BIL", " IC", " KP", " PASSPORT", " MANAGING", " EXECUTIVE"
      ];
      for (let word of cutOffWords) {
        const idx = name.indexOf(word);
        if (idx !== -1) name = name.substring(0, idx).trim();
      }
      name = name.replace(/[^A-Z0-9\)\.\@\&\-\/\s]*$/, ''); 
      name = name.replace(/^[\d\.\)\-\s]+/, '');   
      return name.trim();
    };

    const extractNamesFromStream = (streamText: string) => {
      if (!streamText) return [];
      let cleanStream = streamText.replace(/NO\.?\s+NAME\s+IC\s+NO.*?DATE/g, ''); 
      cleanStream = cleanStream.replace(/NO\.?\s+NAMA\s+NO\.\s+KAD.*?TARIKH/g, '');
      const regex = /(?:\b|^)(\d{1,2})(?:[\.\)\s]*)\s+([A-Z\s\.\'\@\&\-\(\)\/]+?)(?=\s+(?:\d{6,}|\d{5,}[A-Z]|[A-Z]\d{5,}|MALAYSIA|MELAYU|CINA|INDIA|LELAKI|PEREMPUAN|DIRECTOR|PENGARAH|MANAGING|WARGANEGARA))/g;
      let match;
      const names = [];
      while ((match = regex.exec(cleanStream)) !== null) {
        let clean = sanitizeName(match[2]);
        if (clean.length > 3 && /[A-Z]/.test(clean) && !names.includes(clean)) {
          if (!/^[\W\d]+$/.test(clean)) names.push(clean);
        }
      }
      return names;
    };

    const getIndex = (pattern: RegExp) => {
      const m = rawText.match(pattern);
      return m ? m.index || -1 : -1;
    };

    const idxDir = getIndex(/4\.\s*(?:DIRECTORS|PENGARAH)/);
    const idxShare = getIndex(/5\.\s*(?:SHAREHOLDERS|PEMEGANG)/);
    let idxNext = getIndex(/6\.\s*(?:KEY|PERSONEL)/);
    if (idxNext === -1) idxNext = getIndex(/7\.\s*(?:TECHNICAL|TEKNIKAL)/);

    const strDirectors = (idxDir !== -1 && idxShare !== -1) ? rawText.substring(idxDir + 15, idxShare) : "";
    const strShareholders = (idxShare !== -1 && idxNext !== -1) ? rawText.substring(idxShare + 15, idxNext) : "";

    extractedData.directors = extractNamesFromStream(strDirectors);
    extractedData.shareholders = extractNamesFromStream(strShareholders);

    return extractedData;
  }
};
