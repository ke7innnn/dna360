import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class PDFReport(FPDF):
    def header(self):
        # Top banner background (Dark luxury charcoal/slate)
        self.set_fill_color(13, 17, 23)
        self.rect(0, 0, 210, 32, 'F')
        
        # Top accent line (Electric Cyan #00c8c8)
        self.set_fill_color(0, 200, 200)
        self.rect(0, 0, 210, 3, 'F')
        
        # Brand title
        self.set_font('Helvetica', 'B', 15)
        self.set_text_color(255, 255, 255)
        self.set_xy(14, 8)
        self.cell(0, 8, 'DNA 360 FITNESS  |  OFFICIAL SYSTEM CREDENTIALS DIRECTORY', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        # Subtitle
        self.set_font('Helvetica', '', 8.5)
        self.set_text_color(160, 165, 180)
        self.set_xy(14, 18)
        self.cell(140, 6, 'Powai Flagship - Production RBAC & Management Accounts Directory', new_x=XPos.RIGHT, new_y=YPos.TOP)
        
        self.set_font('Helvetica', 'B', 8.5)
        self.set_text_color(0, 200, 200)
        self.set_xy(150, 18)
        self.cell(46, 6, 'CONFIDENTIAL', align='R', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.ln(12)

    def footer(self):
        self.set_y(-15)
        self.set_draw_color(220, 225, 235)
        self.line(14, self.get_y(), 196, self.get_y())
        self.set_font('Helvetica', '', 8)
        self.set_text_color(130, 135, 145)
        self.set_y(-12)
        self.cell(0, 6, f'DNA 360 Fitness Centre - Confidential Internal Document - Page {self.page_no()}', align='C')

def create_pdf(output_paths):
    pdf = PDFReport(orientation='P', unit='mm', format='A4')
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    
    # ─── SECTION 1: GLOBAL ACCESS OVERVIEW ───
    pdf.set_y(36)
    pdf.set_fill_color(240, 249, 250)
    pdf.set_draw_color(0, 180, 180)
    pdf.rect(14, pdf.get_y(), 182, 26, 'FD')
    
    pdf.set_xy(18, pdf.get_y() + 2.5)
    pdf.set_font('Helvetica', 'B', 10)
    pdf.set_text_color(0, 130, 130)
    pdf.cell(0, 5.5, 'Production Login Information', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', '', 8.5)
    pdf.set_text_color(35, 40, 50)
    pdf.set_x(18)
    pdf.cell(85, 5, '* Web Application URL: https://www.dna360.in/login', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(85, 5, '* Standard Default Password: Password@123', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_x(18)
    pdf.cell(85, 5, '* Authentication Engine: Supabase Cloud Auth', new_x=XPos.RIGHT, new_y=YPos.TOP)
    pdf.cell(85, 5, '* Location: 502, Knowledge Park, Powai, Mumbai', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.ln(5)
    
    # ─── SECTION 2: EXECUTIVE & REVENUE LEADERSHIP ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6.5, '1. Executive Administration & Revenue Leadership', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 4, 'Full system administrative capabilities, financial reporting, and user privilege controls.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    headers = ['Name', 'Role', 'Login Email', 'Default Password', 'Access Scope']
    widths = [36, 32, 48, 28, 38]
    
    def render_table(header_list, width_list, data_rows):
        pdf.set_fill_color(24, 32, 47)
        pdf.set_text_color(255, 255, 255)
        pdf.set_font('Helvetica', 'B', 7.5)
        for i, h in enumerate(header_list):
            pdf.cell(width_list[i], 6.5, h, border=1, align='C', fill=True)
        pdf.ln()
        
        pdf.set_font('Helvetica', '', 7.5)
        pdf.set_text_color(20, 25, 35)
        for row_idx, row in enumerate(data_rows):
            fill = row_idx % 2 == 1
            pdf.set_fill_color(246, 248, 251) if fill else pdf.set_fill_color(255, 255, 255)
            for i, val in enumerate(row):
                align = 'C' if i in [1, 3] else 'L'
                pdf.cell(width_list[i], 5.8, val, border=1, align=align, fill=fill)
            pdf.ln()
    
    exec_data = [
        ['Executive Admin', 'Owner / Executive', 'admin@dna360.in', 'Password@123', 'All Features, Full Revenue'],
        ['Keith Shah', 'Administrator', 'keith.mktg@dna360.in', 'Password@123', 'Full Admin Access (All Features)'],
        ['Swapnil Borhade', 'HR Head', 'swapnil.hr@dna360.in', 'Password@123', 'HR, Staff Rosters, Revenue View'],
        ['Monica Picholla', 'Asst. Sales Head', 'monica.sales@dna360.in', 'Password@123', 'Memberships, Sales, Invoicing'],
    ]
    render_table(headers, widths, exec_data)
    pdf.ln(4)
    
    # ─── SECTION 3: FRONT DESK & OPERATIONS ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6.5, '2. Front Desk & Operations (Check-in, Leads, Sales)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 4, 'Front desk QR turnstile check-in scanning, inquiry management, and sales floor enrollments.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    ops_data = [
        ['Front Desk Operations', 'Front Desk', 'frontdesk@dna360.in', 'Password@123', 'Check-in Desk, QR Scanner'],
        ['Surendra Chaudhary', 'Consultant', 'surendra.fc@dna360.in', 'Password@123', 'Sales Leads & Enrollments'],
        ['Krish Rawat', 'Consultant', 'krish.fc@dna360.in', 'Password@123', 'Sales Leads & Enrollments'],
        ['Pallavi More', 'Consultant', 'pallavi.fc@dna360.in', 'Password@123', 'Sales Leads & Enrollments'],
        ['Nisha Jadhav', 'Consultant', 'nisha.fc@dna360.in', 'Password@123', 'Sales Leads & Enrollments'],
        ['Suresh Patil', 'Supervisor', 'suresh.sup@dna360.in', 'Password@123', 'Floor Access & Attendance'],
    ]
    render_table(headers, widths, ops_data)
    pdf.ln(4)

    # ─── SECTION 4: COACHES & TRAINERS ───
    pdf.set_font('Helvetica', 'B', 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6.5, '3. Coaching & Training Department (Sessions & Studios)', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    
    pdf.set_font('Helvetica', 'I', 8)
    pdf.set_text_color(100, 105, 115)
    pdf.cell(0, 4, 'Trainer timetable, class schedules, and personal training client workout programming.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(2)
    
    trainer_data = [
        ['Rajesh Poojary', 'Head Trainer', 'rajesh.coach@dna360.in', 'Password@123', 'Studio Schedule & Trainers'],
        ['Aftab Memon', 'Head Trainer', 'aftab.coach@dna360.in', 'Password@123', 'Studio Schedule & Trainers'],
        ['Pramod Sawant', 'General Trainer', 'pramod.trainer@dna360.in', 'Password@123', 'Assigned PT Clients & Logs'],
        ['Jateen Kadam', 'General Trainer', 'jateen.trainer@dna360.in', 'Password@123', 'Assigned PT Clients & Logs'],
        ['Aditya Shinde', 'General Trainer', 'aditya.trainer@dna360.in', 'Password@123', 'Assigned PT Clients & Logs'],
        ['Vaibhav Pawar', 'General Trainer', 'vaibhav.trainer@dna360.in', 'Password@123', 'Assigned PT Clients & Logs'],
        ['Hussain Shaikh', 'General Trainer', 'hussain.trainer@dna360.in', 'Password@123', 'Assigned PT Clients & Logs'],
        ['Liladhar Gaikwad', 'Masseur', 'liladhar.masseur@dna360.in', 'Password@123', 'Spa & Therapy Appointments'],
    ]
    render_table(headers, widths, trainer_data)
    pdf.ln(5)

    # Security Guidelines
    pdf.set_fill_color(248, 249, 251)
    pdf.set_draw_color(210, 215, 225)
    pdf.rect(14, pdf.get_y(), 182, 18, 'FD')
    pdf.set_xy(17, pdf.get_y() + 2)
    pdf.set_font('Helvetica', 'B', 8)
    pdf.set_text_color(20, 30, 50)
    pdf.cell(0, 4.5, 'Security & Account Best Practices:', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_font('Helvetica', '', 7.5)
    pdf.set_text_color(70, 75, 85)
    pdf.set_x(17)
    pdf.cell(0, 4, '1. All staff members should change their default password upon first logging into the dashboard.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.set_x(17)
    pdf.cell(0, 4, '2. Accounts are locked for 15 minutes following 5 consecutive failed login attempts.', new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    for p in output_paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)
        pdf.output(p)
        print(f'PDF generated successfully: {p}')

if __name__ == '__main__':
    paths = [
        '/Users/kevinpimenta/Desktop/dna/DNA_360_Access_Credentials.pdf',
        '/Users/kevinpimenta/Desktop/dna/public/DNA_360_Access_Credentials.pdf'
    ]
    create_pdf(paths)
