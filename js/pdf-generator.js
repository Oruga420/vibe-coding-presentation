/**
 * PDF Generator — Vibe Coding Presentation + Google AI Studio Guide
 * Uses jsPDF to create a rich, downloadable PDF document.
 */
(function () {
    'use strict';

    const btn = document.getElementById('download-pdf');
    if (!btn) return;

    btn.addEventListener('click', generatePDF);

    const btnOriginalHTML = btn.innerHTML;

    async function generatePDF() {
        btn.disabled = true;
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width:13px;height:13px;flex-shrink:0;animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="32" stroke-dashoffset="12"/></svg> Generating...';

        try {
            // Load jsPDF dynamically
            if (!window.jspdf) {
                try {
                    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
                } catch (e) {
                    // Fallback CDN
                    await loadScript('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/dist/jspdf.umd.min.js');
                }
            }

            if (!window.jspdf) {
                throw new Error('Failed to load jsPDF library. Check your internet connection.');
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const W = 210, H = 297;
            const margin = 20;
            const contentW = W - margin * 2;

            // Colors
            const dark = [5, 5, 5];
            const white = [255, 255, 255];
            const accent = [99, 102, 241];
            const teal = [45, 212, 191];
            const gray = [161, 161, 170];
            const lightGray = [200, 200, 205];

            // ─── HELPER FUNCTIONS ───
            let currentY = 0;

            function checkPage(needed) {
                if (currentY + needed > H - margin) {
                    doc.addPage();
                    currentY = margin;
                    drawPageBg();
                }
            }

            function drawPageBg() {
                doc.setFillColor(...dark);
                doc.rect(0, 0, W, H, 'F');
            }

            function heading(text, size, color, y) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(size);
                doc.setTextColor(...color);
                const lines = doc.splitTextToSize(text, contentW);
                const lineH = size * 0.6;
                checkPage(lineH * lines.length + 6);
                doc.text(lines, margin, y || currentY);
                currentY = (y || currentY) + lineH * lines.length + 4;
            }

            function body(text, y) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(...gray);
                const lines = doc.splitTextToSize(text, contentW);
                checkPage(lines.length * 5 + 4);
                doc.text(lines, margin, y || currentY);
                currentY = (y || currentY) + lines.length * 5 + 4;
            }

            function label(text) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(...accent);
                checkPage(10);
                doc.text(text.toUpperCase(), margin, currentY);
                currentY += 7;
            }

            function accentLine() {
                doc.setDrawColor(...accent);
                doc.setLineWidth(0.3);
                doc.line(margin, currentY, margin + 30, currentY);
                currentY += 6;
            }

            function spacer(n) { currentY += n || 6; }

            function addLink(text, url, x, y) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(9);
                doc.setTextColor(...accent);
                const tw = doc.getTextWidth(text);
                doc.textWithLink(text, x || margin, y || currentY, { url });
                doc.setDrawColor(...accent);
                doc.setLineWidth(0.2);
                doc.line(x || margin, (y || currentY) + 0.5, (x || margin) + tw, (y || currentY) + 0.5);
                currentY = (y || currentY) + 5;
            }

            function bulletPoint(title, desc) {
                const descLines = desc ? doc.splitTextToSize(desc, contentW - 5) : [];
                const needed = 8 + (descLines.length * 4.8) + 6;
                checkPage(needed);
                doc.setFillColor(...accent);
                doc.circle(margin + 1.5, currentY - 1.2, 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...white);
                doc.text(title, margin + 5, currentY);
                currentY += 6;
                if (desc) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(...gray);
                    doc.text(descLines, margin + 5, currentY);
                    currentY += descLines.length * 4.8 + 5;
                }
            }

            function numberedItem(num, title, desc) {
                const descLines = desc ? doc.splitTextToSize(desc, contentW - 12) : [];
                const needed = 10 + (descLines.length * 4.8) + 6;
                checkPage(needed);
                // Number badge
                doc.setFillColor(30, 30, 40);
                doc.roundedRect(margin, currentY - 4, 8, 6, 1, 1, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(...accent);
                doc.text(num, margin + 2.5, currentY);
                // Title
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.setTextColor(...white);
                doc.text(title, margin + 12, currentY);
                currentY += 6;
                // Desc
                if (desc) {
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(9);
                    doc.setTextColor(...gray);
                    doc.text(descLines, margin + 12, currentY);
                    currentY += descLines.length * 4.8 + 6;
                }
            }

            function toolCard(name, desc) {
                checkPage(22);
                doc.setFillColor(18, 18, 24);
                doc.setDrawColor(40, 40, 55);
                doc.roundedRect(margin, currentY - 4, contentW, 18, 2, 2, 'FD');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(...white);
                doc.text(name, margin + 6, currentY + 2);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(8.5);
                doc.setTextColor(...gray);
                doc.text(desc, margin + 6, currentY + 8);
                currentY += 20;
            }

            // ─── Section starter — always begins on a fresh page ───
            function newSection() {
                doc.addPage();
                drawPageBg();
                currentY = margin;
            }

            // ═══════════════════════════════════════
            // PAGE 1 — COVER
            // ═══════════════════════════════════════
            drawPageBg();

            // Accent line at top
            doc.setFillColor(...accent);
            doc.rect(0, 0, W, 3, 'F');

            // Title
            currentY = 100;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(48);
            doc.setTextColor(...white);
            doc.text('VIBE CODING', W / 2, currentY, { align: 'center' });
            currentY += 18;

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(...gray);
            doc.text('The Era of Personal App Building', W / 2, currentY, { align: 'center' });
            currentY += 10;

            // Accent divider
            doc.setDrawColor(...accent);
            doc.setLineWidth(0.5);
            doc.line(W / 2 - 20, currentY, W / 2 + 20, currentY);
            currentY += 15;

            doc.setFontSize(10);
            doc.setTextColor(...lightGray);
            doc.text('Alejandro De La Mora  |  @Oruga', W / 2, currentY, { align: 'center' });
            currentY += 20;

            // Links
            doc.setFontSize(9);
            doc.setTextColor(...accent);
            const link1 = 'www.eloruga.com';
            const link2 = 'www.vibecodingcolosseum.com';
            const tw1 = doc.getTextWidth(link1);
            const tw2 = doc.getTextWidth(link2);
            doc.textWithLink(link1, W / 2 - tw1 / 2, currentY, { url: 'https://www.eloruga.com' });
            currentY += 6;
            doc.textWithLink(link2, W / 2 - tw2 / 2, currentY, { url: 'https://www.vibecodingcolosseum.com' });

            // Footer
            doc.setFontSize(7);
            doc.setTextColor(80, 80, 90);
            doc.text('Comprehensive Guide + Presentation Deck', W / 2, H - 15, { align: 'center' });

            // ═══════════════════════════════════════
            // PAGE 2 — THE SHIFT
            // ═══════════════════════════════════════
            newSection();

            label('01 / THE SHIFT');
            heading('From Factory to Kitchen.', 28, white);
            spacer(6);
            body('Software used to be industrial. Now it\'s personal. You don\'t need a factory to cook a meal. You just need ingredients and intent.');
            spacer(6);
            body('For decades, building software required teams of engineers, months of sprints, and millions in funding. The tools were complex, the barriers were high, and the average person was locked out of the creation process.');
            spacer(6);
            body('Vibe Coding changes this paradigm entirely. It\'s the idea that anyone with a clear vision and the right AI tools can build functional, beautiful software — not in months, but in hours. It\'s not about replacing developers; it\'s about democratizing the ability to create.');
            spacer(6);
            body('Think of it like cooking: you don\'t need to be a Michelin-star chef to make a great meal at home. You need good ingredients (AI models), a recipe (your prompt), and the willingness to experiment. The "factory" of software is giving way to the "kitchen" of personal app building.');

            // ═══════════════════════════════════════
            // PAGE 3 — MENTAL FRAMEWORK
            // ═══════════════════════════════════════
            newSection();

            label('02 / THE MENTAL STACK');
            heading('The Mental Framework.', 28, white);
            spacer(6);
            body('Every great output from AI starts with a great input. The Mental Framework is a 5-layer structure for crafting prompts that actually work. Master this, and you\'ll get 10x better results from any AI model.');
            spacer(8);

            numberedItem('01', 'Meta — What is success?', 'Before you type a single word, define what a successful output looks like. Is it a landing page? An API? A data analysis? Be specific. "Build me a website" is weak. "Build me a SaaS landing page with pricing tiers, dark mode, and a waitlist form" is powerful.');
            numberedItem('02', 'Context — The raw data.', 'Feed the AI everything it needs to understand your world. This includes your brand guidelines, existing code, technical constraints, target audience, and competitive landscape. The more context, the better the output.');
            numberedItem('03', 'Rules — Constraints & Format.', 'Set boundaries. "Use TypeScript, not JavaScript." "Follow REST API conventions." "Keep the response under 500 words." Rules prevent the AI from hallucinating or going off-track.');
            numberedItem('04', 'Examples — Show, don\'t just tell.', 'Include 2-3 examples of what you want. This is few-shot prompting. If you want a specific JSON structure, show it. If you want a specific code style, paste a sample.');
            numberedItem('05', 'Request — The trigger.', 'Now, and only now, make your actual request. Be direct and actionable. "Generate the React component for the pricing section based on the above context, rules, and examples."');

            // ═══════════════════════════════════════
            // PAGE 4 — THE ARSENAL
            // ═══════════════════════════════════════
            newSection();

            label('03 / THE ARSENAL');
            heading('The Tools.', 28, white);
            spacer(6);
            body('You don\'t need a hundred tools. You need the right four. Each one serves a distinct purpose in the Vibe Coding workflow, and together they form a complete stack for building production-ready applications.');
            spacer(8);

            toolCard('Google AI Studio', 'The Brain — 2M context window, multimodal input, free tier');
            body('The command center. Feed it entire codebases, design systems, and documentation. It understands text, images, audio, video, and PDFs. The free tier is incredibly generous.');
            spacer(6);

            toolCard('Lovable.dev', 'The Face — Instant UI generation from descriptions');
            body('Turns natural language descriptions into beautiful, functional user interfaces. Perfect for prototyping ideas rapidly and creating polished UIs.');
            spacer(6);

            toolCard('Replit', 'The Engine — Full-stack development + instant deployment');
            body('A complete cloud development environment with backend capabilities, database integration, and one-click deployment. Ideal for MVPs.');
            spacer(6);

            toolCard('Cursor / Windsurf', 'The Surgical Knife — AI-powered code editor');
            body('AI-native code editors that understand your entire codebase. Perfect for refactoring, debugging, and making targeted changes.');

            // ═══════════════════════════════════════
            // PAGE 5 — COLOSSEUM
            // ═══════════════════════════════════════
            newSection();

            label('THE ARENA');
            heading('VIBE CODING COLOSSEUM', 28, white);
            spacer(4);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.setTextColor(...teal);
            checkPage(12);
            doc.text('Gladiators Wanted.', margin, currentY);
            currentY += 10;

            body('$100 Prize  ·  30 Minutes  ·  Pure Flow.');
            spacer(6);
            body('The Vibe Coding Colosseum is a live competition where builders go head-to-head in a 30-minute sprint. Using only AI tools and their creativity, participants must build a functional application from scratch.');
            spacer(6);
            body('It\'s not about who\'s the best programmer. It\'s about who can communicate their vision most effectively to AI and ship something real in half an hour. The audience votes. The best builder takes the prize.');
            spacer(6);
            body('Whether you\'re a seasoned developer or someone who\'s never written a line of code, the Colosseum levels the playing field. If you can think clearly and describe what you want, you can compete.');
            spacer(10);

            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(...white);
            checkPage(10);
            doc.text('Register & compete:', margin, currentY);
            currentY += 6;
            addLink('www.vibecodingcolosseum.com', 'https://www.vibecodingcolosseum.com');

            // ═══════════════════════════════════════
            // PAGE 6 — GOOGLE AI STUDIO GUIDE (PART 1)
            // ═══════════════════════════════════════
            newSection();

            // Section accent bar
            doc.setFillColor(...teal);
            doc.rect(margin, currentY - 4, contentW, 2, 'F');
            currentY += 6;

            label('BONUS GUIDE');
            heading('Google AI Studio:', 28, white);
            heading('Complete Guide', 28, teal);
            spacer(6);
            body('Google AI Studio (aistudio.google.com) is a free, web-based environment for prototyping and building with Google\'s Gemini AI models. This guide covers everything you need to go from zero to productive.');
            spacer(8);

            heading('Getting Started', 16, white);
            spacer(4);
            numberedItem('01', 'Go to aistudio.google.com', 'Open your browser and navigate to aistudio.google.com. Sign in with your Google account. No software installation required.');
            numberedItem('02', 'Choose your model', 'Select from Gemini 2.5 Pro (most capable), Gemini Flash (fast), or Gemini Pro. Pro for complex reasoning, Flash for speed.');
            numberedItem('03', 'Select your interaction mode', 'Choose "Chat" for conversational interactions, or use the prompt editor for single-turn prompts.');
            numberedItem('04', 'Upload your context', 'Upload files (PDFs, images, code, audio, video) directly into your session. Gemini processes all of them.');

            // ═══════════════════════════════════════
            // PAGE 7 — KEY FEATURES
            // ═══════════════════════════════════════
            newSection();

            heading('Key Features', 16, white);
            spacer(4);

            bulletPoint('2M Token Context Window', 'Process up to 2 million tokens in a single session — roughly 1.4 million words or 100,000 lines of code. Feed it entire codebases and it maintains coherence.');
            bulletPoint('Multimodal Input', 'Upload images, audio, video, PDFs, and URLs. Gemini understands all formats natively. Show it a screenshot of a bug and ask it to fix the code.');
            bulletPoint('System Instructions', 'Set persistent instructions that shape every response. Example: "You are a senior TypeScript developer. Always use functional components."');
            bulletPoint('Temperature Control', 'Low temperature (0.1-0.3) = deterministic outputs. High temperature (0.8-1.0) = creative outputs. Use low for code, high for brainstorming.');
            bulletPoint('Code Export', 'Export working prompts as Python, Node.js, or REST API snippets. Copy-paste into your app.');
            bulletPoint('Grounding with Google Search', 'Let Gemini access real-time web data for fact-checking and up-to-date documentation.');
            bulletPoint('Structured Output', 'Force responses in specific formats (JSON, XML, tables). Essential for programmatic parsing.');

            // ═══════════════════════════════════════
            // PAGE 8 — PROMPTING BEST PRACTICES
            // ═══════════════════════════════════════
            newSection();

            heading('Prompting Best Practices', 16, white);
            spacer(4);

            numberedItem('01', 'Be specific and direct', '"Write a Python Flask API with 3 endpoints: GET /users, POST /users, DELETE /users/:id. Use SQLAlchemy ORM. Return JSON." This is 10x better than "make me an API."');
            numberedItem('02', 'Use system instructions', 'Set the persona and constraints upfront. "You are a full-stack developer specializing in Next.js and Supabase."');
            numberedItem('03', 'Provide examples (Few-Shot)', 'Show 2-3 examples of what you want. If you need a specific JSON format, paste a sample. Examples are the strongest signal.');
            numberedItem('04', 'Break complex tasks down', 'Don\'t ask for an entire app in one prompt. Break it: "First, design the schema. Then API routes. Then frontend."');
            numberedItem('05', 'Use the token counter', 'Watch the live token counter. If approaching the limit, summarize earlier context or start a new session.');
            numberedItem('06', 'Iterate relentlessly', 'Your first prompt is never your best. Review, identify gaps, and refine. That\'s how you go from 80% to 100%.');
            numberedItem('07', 'Upload, don\'t paste', 'For large files, use the upload feature. It\'s cleaner, preserves formatting, and uses tokens more efficiently.');

            // ═══════════════════════════════════════
            // PAGE 9 — PRO TIPS + WORKFLOWS
            // ═══════════════════════════════════════
            newSection();

            heading('Pro Tips & Workflows', 16, white);
            spacer(4);

            bulletPoint('The "Dump Everything" Workflow', 'Upload your entire project at the start. Then ask: "Analyze this project and suggest improvements." Gemini\'s massive context window makes this possible.');
            bulletPoint('The "Architect First" Pattern', 'Before writing code, ask Gemini to design the architecture. "Design the folder structure, list components, define data models, outline API routes."');
            bulletPoint('The "Rubber Duck" Technique', 'Use Gemini as your rubber duck. Explain your problem in detail, paste error messages, share code. The AI spots patterns humans miss.');
            bulletPoint('Save & Reuse Prompts', 'When you craft a perfect prompt template, save it. Google AI Studio lets you save and reuse prompts for common tasks.');
            bulletPoint('Cost Optimization', 'Use Flash for simple tasks, reserve Pro for complex reasoning. This stretches your free tier significantly.');
            bulletPoint('Vision for Debugging', 'Screenshot your broken UI and upload it. Ask: "Fix the CSS." Visual debugging with AI is incredibly powerful.');

            spacer(10);
            doc.setDrawColor(...teal);
            doc.setLineWidth(0.5);
            checkPage(30);
            doc.line(margin, currentY, margin + contentW, currentY);
            currentY += 10;

            heading('Don\'t ask for permission.', 20, white);
            heading('Just build.', 20, teal);
            spacer(10);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.setTextColor(...gray);
            checkPage(20);
            doc.text('Connect with us:', margin, currentY);
            currentY += 6;
            addLink('www.eloruga.com', 'https://www.eloruga.com');
            addLink('www.vibecodingcolosseum.com', 'https://www.vibecodingcolosseum.com');

            spacer(12);
            doc.setFontSize(7);
            doc.setTextColor(60, 60, 70);
            doc.text('© 2026 Alejandro De La Mora | @Oruga | All rights reserved.', W / 2, currentY, { align: 'center' });

            // ─── SAVE ───
            doc.save('Vibe-Coding-Guide.pdf');

        } catch (err) {
            console.error('PDF generation failed:', err);
            const msg = (err && err.message) ? err.message : String(err);
            alert('PDF generation failed. Please try again.\n\nError: ' + msg);
        } finally {
            // Always restore the button, even if there was an error
            btn.disabled = false;
            btn.innerHTML = btnOriginalHTML;
        }
    }

    function loadScript(src) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            s.onload = resolve;
            s.onerror = () => reject(new Error('Failed to load script: ' + src));
            document.head.appendChild(s);
        });
    }
})();
