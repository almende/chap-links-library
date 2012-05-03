module Jekyll 
  module Filters 
    require 'pathname'

    def gwt_files(output) 
      Dir.glob('gwt/files/*.zip').each do |i| 
        file = Pathname.new(i).basename
        output << "- [#{file}](#{i})\n" 
      end
      output 
    end 
  end 
end 
