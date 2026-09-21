/**
 * The golden retriever that sits in the footer (FooterDog), rebuilt from a piece of dense ASCII art
 * (private/ascii-sources/golden-retriever-ascii-reference.webp). The reference
 * was read as a grayscale photo: inked glyphs blurred into tone, cropped to the
 * dog, box-downsampled to 28 rows at a 0.72 cell aspect, then rank-equalised so
 * the whole ramp gets used. Ramp, light to dense: ` .,:;irsXA253hMHGS#9B&@`.
 *
 * Three cells by the eye (rows 9 and 10) came out blank, a hole enclosed by
 * the fur that read as a gap. They are filled with the average density of
 * their neighbours.
 */
export const DOG = `                    :;A;;;;:
                  :iisAssA3SSX:
                 :i;;;i;iiiXMH#5:
               :riirrrs5hXs2hM9&BX
               i;;;rrA2Xh5AhSh3H9Bi
              srriiAXrsA2sXH&&B9#BG:
            :rsAi:;SHX:s5srsS@BB&@H#:
            rs:;;;SB9s:;i;iir53HMGG93
            sXi;s5G9Gi;iirXsA3MHB#&&&:
           :52is3:AA:;iiXAX35rMH#&BG&H
           :hMr2rr::;ii;s3333AAMS99h#S
           5MH3M2:i;srisH@@@@@hG9&@HBX
           Xhh33Hssir;:5&&&&&&S9H9BG:
:          A5hhAHM2s;i;:S&&&&B99H9&#:
MM:       ;rMGB3ASG5i:i::#&@&&&BG##&X
;H5i:  :;sr:;53Ar2##GAis2M#9BB9SG#HSX
 sMHHhAh3AA:;ri2XXSSGGGhG#9B&#H#&9#9:
   ;35255AX;i2;r2AGMAAGGHh33HSSBB##9:
     :XAh2Xrrrrrr5HhhhMMG#S&BB##9B9H
     ;AA2352rsXirA23h3HS9B@9@@@@@@S;
     :2A2222s;ir;rssXhMHHMSSSSG#9G;
      XX2A3hAsXrXXA2523M9GG#SS#9#;
       X23325srissrAM5M3hS#9S#99r
       :iA3325XX;iAXXXXsXX2MMhM2
         :sMHM35h2535Mh3MMh5hHHG:
            rG#M5A52hh5Mh22SGGB&B:
              :;553hHHG#2 :hSBBBBG
                :5G99B&B     5S#S;`
