import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const processDocument = (pdfPath) => {
    return new Promise((resolve, reject) => {

        // Path to Python environment
        const pythonExecutable = path.join(
            __dirname,
            "../../../nlp-services/venv/Scripts/python.exe"
        );

        // Path to PDF extractor
        const pdfExtractor = path.join(
            __dirname,
            "../../../nlp-services/app/pdf_extractor.py"
        );

        // Path to NLP service
        const nlpScript = path.join(
            __dirname,
            "../../../nlp-services/app/nlp_service.py"
        );

        // =====================================================
        // STEP 1: PDF EXTRACTION
        // =====================================================

        const pdfProcess = spawn(
            pythonExecutable,
            [pdfExtractor, pdfPath]
        );

        let extractedText = "";

        pdfProcess.stdout.on("data", (data) => {
            extractedText += data.toString();
        });

        pdfProcess.stderr.on("data", (data) => {
            console.error(`PDF extractor error: ${data}`);
        });

        pdfProcess.on("error", (error) => {
            reject(
                new Error(`Failed to start PDF extractor: ${error.message}`)
            );
        });

        pdfProcess.on("close", (code) => {

            if (code !== 0) {
                return reject(
                    new Error("PDF extraction failed")
                );
            }

            // =====================================================
            // STEP 2: PARSE EXTRACTED CHUNKS
            // =====================================================

            let chunks;

            try {
                chunks = JSON.parse(extractedText);
            } catch (error) {
                return reject(
                    new Error(
                        "Invalid JSON received from PDF extractor"
                    )
                );
            }

            // =====================================================
            // STEP 3: NLP PROCESSING
            // =====================================================

            const nlpProcess = spawn(
                pythonExecutable,
                [nlpScript]
            );

            let nlpOutput = "";

            nlpProcess.stdout.on("data", (data) => {
                nlpOutput += data.toString();
            });

            nlpProcess.stderr.on("data", (data) => {
                console.error(`NLP error: ${data}`);
            });

            nlpProcess.on("error", (error) => {
                reject(
                    new Error(`Failed to start NLP service: ${error.message}`)
                );
            });

            // Send extracted chunks to NLP service
            nlpProcess.stdin.write(
                JSON.stringify(chunks)
            );

            nlpProcess.stdin.end();

            // =====================================================
            // STEP 4: NLP FINISHED
            // =====================================================

            nlpProcess.on("close", (nlpCode) => {

                if (nlpCode !== 0) {
                    return reject(
                        new Error("NLP processing failed")
                    );
                }

                let nlpResults;

                try {
                    nlpResults = JSON.parse(nlpOutput);
                } catch (error) {
                    return reject(
                        new Error(
                            "Invalid JSON received from NLP service"
                        )
                    );
                }

                resolve(nlpResults);
            });
        });
    });
};