import csv

with open('/Users/amity/Downloads/โครงการ lalin tonw and Lanceo Crib ลำลูกกา 4-5 เดือน ก.ค. 2568 - sheet1.csv', 'r') as f:
    reader = csv.reader(f)
    next(reader)
    next(reader)
    
    total_houses = 0
    with_arrears = 0
    with_arrears_paid = 0
    with_discount = 0
    
    for row in reader:
        if not row[0] or not row[0].strip() or row[0].startswith('รวม'):
            continue
        total_houses += 1
        
        arrears = row[7].strip() if len(row) > 7 else ''
        arrears_paid = row[8].strip() if len(row) > 8 else ''
        discount = row[26].strip() if len(row) > 26 else ''
        
        if arrears and arrears != '0':
            with_arrears += 1
        if arrears_paid and arrears_paid != '0':
            with_arrears_paid += 1
        if discount and discount != '0':
            with_discount += 1
    
    print(f'Total houses: {total_houses}')
    print(f'Houses with prior arrears: {with_arrears}')
    print(f'Houses with arrears payment: {with_arrears_paid}')
    print(f'Houses with discount: {with_discount}')
    
    # Count payment records
    f.seek(0)
    reader = csv.reader(f)
    next(reader)
    next(reader)
    total_records = 0
    for row in reader:
        if not row[0] or not row[0].strip() or row[0].startswith('รวม'):
            continue
        for m_idx in range(9, 21):
            if len(row) > m_idx and row[m_idx].strip():
                total_records += 1
    print(f'Total payment records to import: {total_records}')
