import pandas as pd
import os

def clean_and_save_dataset(file_paths: list[str], filenames: list[str]) -> str:
    """Clean and merge datasets on a common ID column."""
    dataframes = []
    
    for path, name in zip(file_paths, filenames):
        if name.endswith('.csv'):
            df = pd.read_csv(path)
        else:
            df = pd.read_excel(path)
        dataframes.append(df)

    if len(dataframes) > 1:
        main_df = dataframes[0]
        
        for next_df in dataframes[1:]:
            main_id_col = next((c for c in main_df.columns if 'id' in c.lower()), None)
            next_id_col = next((c for c in next_df.columns if 'id' in c.lower()), None)
            
            if main_id_col and next_id_col:
                main_df = pd.merge(main_df, next_df, left_on=main_id_col, right_on=next_id_col, how='outer')
                if main_id_col != next_id_col:
                    main_df = main_df.drop(columns=[next_id_col])
        
        df = main_df
    else:
        df = dataframes[0]

    df = df.drop_duplicates()
    
    original_cols = {c.lower().strip(): c for c in df.columns}
    
    standard_map = {
        'amount': 'Amount', 'sales': 'Amount', 'revenue': 'Amount', 'total': 'Amount',
        'profit': 'Profit', 'margin': 'Profit', 'gain': 'Profit',
        'quantity': 'Quantity', 'qty': 'Quantity', 'count': 'Quantity',
        'order date': 'Date', 'date': 'Date', 'transaction date': 'Date', 'time': 'Date'
    }

    for low_col, standard_name in standard_map.items():
        if low_col in original_cols and standard_name not in df.columns:
            df = df.rename(columns={original_cols[low_col]: standard_name})

    for col in ['Amount', 'Profit', 'Quantity']:
        if col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).str.replace(r'[$,%]', '', regex=True).str.replace(',', '', regex=False)
            df[col] = pd.to_numeric(df[col], errors='coerce')
            
    df = df.fillna(0)

    base_path = file_paths[0]
    clean_file_path = base_path.rsplit('.', 1)[0] + '_cleaned.csv'
    df.to_csv(clean_file_path, index=False)
    
    for path in file_paths:
        if path != clean_file_path and os.path.exists(path):
            os.remove(path)
            
    return clean_file_path
