import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://dfkutkebldgpmwpphutb.supabase.co";
const supabaseKey = "sb_publishable_woIueedSG-l-5R716khR_A__Oxix-ah";

export const supabase = createClient(supabaseUrl, supabaseKey);
